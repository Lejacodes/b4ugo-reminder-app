import { createAIClient, isRemoteAIConfigured, resolveRemoteTarget } from '@/lib/ai/ai-client';
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/ai/ai-prompts';
import type { AIProvider } from '@/lib/ai/ai-provider';
import { runChatTurn } from '@/lib/ai/chat-service';
import { FallbackAIProvider, formatToolResult } from '@/lib/ai/fallback-provider';
import { parseRemotePayload, parseRemoteTarget, RemoteLLMProvider } from '@/lib/ai/remote-provider';
import { ResilientAIProvider } from '@/lib/ai/resilient-provider';
import { creationResult } from '@/lib/ai/tool-result';
import type { AIContextSnapshot, AIResponse } from '@/lib/ai/types';

const empty: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [],
  necessities: [],
  trips: [
    {
      id: 'trip-1',
      title: 'Antalya vacation',
      destination: 'Antalya',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      durationDays: 5,
      activity: 'beach',
      packed: 1,
      total: 4,
    },
  ],
  places: [],
  intentions: [{ id: 'i1', tripId: 'trip-1', title: 'try a café', type: 'food', placeName: 'Antalya' }],
  packing: [{ id: 'p1', tripId: 'trip-1', title: 'sunscreen', checked: false }],
  weather: null,
  activeDestination: null,
};

class ScriptedProvider implements AIProvider {
  constructor(private readonly replies: AIResponse[]) {}
  private index = 0;
  async complete(): Promise<AIResponse> {
    return this.replies[this.index++] ?? { message: 'okay.', toolCalls: [] };
  }
}

describe('chat tool loop', () => {
  it('formats every creation confirmation from the verified display name', () => {
    expect(formatToolResult('createReminder', creationResult('Call mum'))).toBe('saved “Call mum” ♡');
    expect(formatToolResult('createTrip', creationResult('Antalya'))).toBe('saved your trip to Antalya ♡');
    expect(formatToolResult('createSavedPlace', creationResult('Corner café'))).toBe(
      'saved “Corner café” for later ♡',
    );
    expect(formatToolResult('addIntention', creationResult('Try piyaz'))).toBe(
      'saved “Try piyaz” for later ♡',
    );
  });

  it('runs a reminder through the validated layer', async () => {
    const execute = jest.fn().mockResolvedValue(creationResult('buy sunscreen'));
    const turn = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'remind me to buy sunscreen tomorrow',
      context: empty,
      execute,
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'createReminder',
        args: expect.objectContaining({ title: 'buy sunscreen' }),
      }),
    );
    expect(turn.unavailable).toBe(false);
    expect(turn.assistantMessage).toContain('buy sunscreen');
    expect(turn.assistantMessage).not.toMatch(/i(?:'|’)ll remember that/i);
  });

  it('uses the verified reminder title instead of repeating a generic acknowledgement', async () => {
    const execute = jest.fn(async (call) => creationResult(String(call.args.title)));
    const history = [
      { role: 'user' as const, content: 'remind me to buy milk' },
      { role: 'assistant' as const, content: "sure ♡ i'll remember that." },
    ];
    const turn = await runChatTurn({
      provider: new FallbackAIProvider(),
      history,
      userText: 'remind me to call the dentist',
      context: empty,
      execute,
    });
    expect(turn.assistantMessage).toBe('saved “call the dentist” ♡');
  });

  it('asks which supermarket instead of inventing one', async () => {
    const execute = jest.fn();
    const turn = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: "remind me to buy dog food when i'm near the supermarket",
      context: empty,
      execute,
    });
    expect(execute).not.toHaveBeenCalled();
    expect(turn.assistantMessage).toMatch(/which supermarket/i);
  });

  it('reads saved data and packing from real state', async () => {
    const execute = jest.fn(async (call) => {
      if (call.name === 'getUpcomingContext') {
        return { trips: empty.trips, places: empty.places, intentions: empty.intentions };
      }
      if (call.name === 'getTodayContext') return empty.reminders;
      if (call.name === 'getPackingList') {
        return { missing: ['sunscreen'], packed: 1, total: 4 };
      }
      if (call.name === 'suggestPacking') {
        return [{ title: 'swimsuit', reason: 'beach activity' }];
      }
      return null;
    });

    const saved = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'what did i save?',
      context: empty,
      execute,
    });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ name: 'getUpcomingContext' }));
    expect(saved.assistantMessage).toMatch(/café|Antalya/i);

    const today = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'what do i need to remember today?',
      context: empty,
      execute,
    });
    expect(today.assistantMessage).toMatch(/calm|waiting/i);

    const missing = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'what am i missing for my trip?',
      context: empty,
      execute,
    });
    expect(missing.assistantMessage).toMatch(/sunscreen/i);

    const packing = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'what should I pack for Antalya?',
      context: empty,
      execute,
    });
    expect(packing.assistantMessage).toMatch(/swimsuit/i);
  });

  it('creates a trip and saves a plan from natural language', async () => {
    const execute = jest.fn(async (call) =>
      call.name === 'createTrip' ? creationResult(String(call.args.destination)) : creationResult(String(call.args.title)),
    );
    const trip = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: "I'm going to Antalya September 15 to September 20",
      context: { ...empty, trips: [] },
      execute,
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'createTrip',
        args: expect.objectContaining({ destination: 'Antalya' }),
      }),
    );
    expect(trip.assistantMessage).toMatch(/antalya/i);

    const plan = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'I want to try this cafe in Antalya',
      context: empty,
      execute,
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'addIntention',
        args: expect.objectContaining({ tripId: 'trip-1' }),
      }),
    );
    expect(plan.assistantMessage.length).toBeGreaterThan(0);
  });

  it('does not replay an old save result on the next conversation turn', async () => {
    const provider = new FallbackAIProvider();
    const first = await runChatTurn({
      provider,
      history: [],
      userText: 'remind me to meow',
      context: empty,
      execute: async () => creationResult('meow'),
    });
    const second = await runChatTurn({
      provider,
      history: first.messages,
      userText: 'what r u doing',
      context: empty,
      execute: jest.fn(),
    });

    expect(second.assistantMessage.length).toBeGreaterThan(0);
    expect(second.assistantMessage).not.toMatch(/saved|meow/i);
  });

  it('shows only the verified post-tool confirmation in visible chat', async () => {
    const turn = await runChatTurn({
      provider: new ScriptedProvider([
        {
          message: "sure ♡ i'll remember that.",
          toolCalls: [{ name: 'createReminder', args: { title: 'meow', category: 'specific' } }],
        },
        { message: 'done', toolCalls: [] },
      ]),
      history: [],
      userText: 'remind me to meow',
      context: empty,
      execute: async () => creationResult('meow'),
    });
    const visibleAssistant = turn.messages.filter(
      (message) => message.role === 'assistant' && (message.toolCalls?.length ?? 0) === 0,
    );

    expect(visibleAssistant.map((message) => message.content)).toEqual(['saved “meow” ♡']);
  });

  it('does not infer creation success from an entity title alone', async () => {
    const turn = await runChatTurn({
      provider: new FallbackAIProvider(),
      history: [],
      userText: 'remind me to meow',
      context: empty,
      execute: async () => ({ title: 'meow' }),
    });
    expect(turn.assistantMessage).not.toMatch(/saved|remember that/i);
  });

  it('runs local actions when the remote model refuses with text only', async () => {
    const execute = jest.fn().mockResolvedValue({ completed: 2 });
    const turn = await runChatTurn({
      provider: new ScriptedProvider([
        { message: "i still can't check off reminders for you", toolCalls: [] },
      ]),
      history: [],
      userText: 'Check off all my reminders',
      context: empty,
      execute,
    });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ name: 'completeAllReminders' }));
    expect(turn.assistantMessage).toMatch(/checked off|done/i);
  });

  it('does not claim a delete when the store removed nothing', async () => {
    const execute = jest.fn().mockResolvedValue({ success: false, deletedCount: 0 });
    const turn = await runChatTurn({
      provider: new ScriptedProvider([
        {
          message: 'removed them all!',
          toolCalls: [{ name: 'deleteReminder', args: { title: 'keys', confirm: 'yes' } }],
        },
        { message: 'removed them all!', toolCalls: [] },
      ]),
      history: [],
      userText: 'clear checked items',
      context: empty,
      execute,
    });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'deleteReminder', args: expect.objectContaining({ title: 'keys' }) }),
    );
    expect(turn.assistantMessage).toBe("I couldn't find any checked items to remove.");
  });

  it('rejects malformed tool arguments without executing', async () => {
    const execute = jest.fn();
    const turn = await runChatTurn({
      provider: new ScriptedProvider([
        { message: '', toolCalls: [{ name: 'createReminder', args: {} }] },
        { message: 'what should i remember?', toolCalls: [] },
      ]),
      history: [],
      userText: 'remember it',
      context: empty,
      execute,
    });
    expect(execute).not.toHaveBeenCalled();
    expect(turn.assistantMessage).toMatch(/remember/i);
  });

  it('blocks destructive deletes without an id', async () => {
    const execute = jest.fn();
    const turn = await runChatTurn({
      provider: new ScriptedProvider([
        { message: '', toolCalls: [{ name: 'deleteReminder', args: {} }] },
        { message: 'i need to know which reminder you mean.', toolCalls: [] },
      ]),
      history: [],
      userText: 'delete that',
      context: empty,
      execute,
    });
    expect(execute).not.toHaveBeenCalled();
    expect(turn.assistantMessage).toMatch(/which reminder/i);
  });

  it('keeps chatting for greetings and feelings', async () => {
    const execute = jest.fn();
    const fallback = new FallbackAIProvider();
    const hi = await runChatTurn({
      provider: fallback,
      history: [],
      userText: 'hiiii',
      context: empty,
      execute,
    });
    expect(hi.assistantMessage).toMatch(/^hiiii ♡$/);
    expect(
      (await runChatTurn({ provider: fallback, history: [], userText: 'how are you?', context: empty, execute }))
        .assistantMessage,
    ).toMatch(/sleepy|constellation/i);
    expect(
      (await runChatTurn({ provider: fallback, history: [], userText: 'thank you', context: empty, execute }))
        .assistantMessage,
    ).toBe('always ♡');
    expect(
      (await runChatTurn({ provider: fallback, history: [], userText: "i'm tired", context: empty, execute }))
        .assistantMessage,
    ).not.toMatch(/reminder/i);
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('provider configuration', () => {
  const previous = process.env.EXPO_PUBLIC_AI_API_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    if (previous == null) delete process.env.EXPO_PUBLIC_AI_API_URL;
    else process.env.EXPO_PUBLIC_AI_API_URL = previous;
  });

  it('uses the local fallback when no AI API or Supabase is configured', () => {
    delete process.env.EXPO_PUBLIC_AI_API_URL;
    expect(resolveRemoteTarget('', false)).toBeNull();
  });

  it('prefers Gemini via the supabase function when a backend is configured', () => {
    process.env.EXPO_PUBLIC_AI_API_URL = 'https://example.com/little-guy';
    expect(isRemoteAIConfigured()).toBe(true);
    expect(createAIClient()).toBeInstanceOf(ResilientAIProvider);
    expect(parseRemoteTarget('supabase')).toEqual({ kind: 'supabase-function', name: 'little-guy' });
    expect(resolveRemoteTarget('', true)).toEqual({ kind: 'supabase-function', name: 'little-guy' });
  });

  it('falls back to the local interpreter if Gemini is unreachable', async () => {
    const primary: AIProvider = {
      complete: async () => ({ message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true }),
    };
    const provider = new ResilientAIProvider(primary, new FallbackAIProvider());
    const reply = await provider.complete({
      messages: [{ role: 'user', content: 'hiiii' }],
      context: empty,
    });
    expect(reply.unavailable).toBeFalsy();
    expect(reply.message).toMatch(/^hiiii ♡$/);
  });

  it('parses a remote payload and drops unknown tools', () => {
    const parsed = parseRemotePayload({
      message: 'okay',
      toolCalls: [
        { name: 'createReminder', args: { title: 'milk' } },
        { name: 'dropDatabase', args: {} },
      ],
    });
    expect(parsed.toolCalls).toEqual([{ name: 'createReminder', args: { title: 'milk' } }]);
    expect(parseRemotePayload({})).toMatchObject({ unavailable: true, message: AI_UNAVAILABLE_MESSAGE });
  });

  it('calls the remote backend without a client API key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'hiiii ♡', toolCalls: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const provider = new RemoteLLMProvider({ kind: 'http', url: 'https://example.com/little-guy' });
    const reply = await provider.complete({
      messages: [{ role: 'user', content: 'hi' }],
      context: empty,
    });
    expect(reply.message).toBe('hiiii ♡');
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).not.toMatch(/sk-|api_key|service.role/i);
  });
});
