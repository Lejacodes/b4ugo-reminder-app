import { createAIClient, isRemoteAIConfigured, resolveRemoteTarget } from '@/lib/ai/ai-client';
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/ai/ai-prompts';
import type { AIProvider } from '@/lib/ai/ai-provider';
import { runChatTurn } from '@/lib/ai/chat-service';
import { FallbackAIProvider } from '@/lib/ai/fallback-provider';
import { parseRemotePayload, parseRemoteTarget, RemoteLLMProvider } from '@/lib/ai/remote-provider';
import { ResilientAIProvider } from '@/lib/ai/resilient-provider';
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
  it('runs a reminder through the validated layer', async () => {
    const execute = jest.fn().mockResolvedValue({ saved: true });
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
    expect(turn.assistantMessage).toMatch(/tomorrow/i);
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
    const execute = jest.fn().mockResolvedValue({ saved: true });
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
