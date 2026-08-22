import { interpretLocally } from '@/lib/ai/fallback-provider';
import { AI_AMBIGUOUS_MESSAGE, AI_GENTLE_HERE_MESSAGE, AI_UNAVAILABLE_MESSAGE } from '@/lib/ai/ai-prompts';
import { isGenericPlaceName, protectNecessitiesFromPacking, validateToolCall } from '@/lib/ai/ai-tools';
import type { AIContextSnapshot } from '@/lib/ai/types';

const empty: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [],
  necessities: ['Keys'],
  trips: [
    {
      id: 'trip-1',
      title: 'Antalya vacation',
      destination: 'Antalya',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      durationDays: 5,
      activity: 'beach',
      packed: 0,
      total: 4,
    },
  ],
  places: [],
  intentions: [],
  weather: null,
  activeDestination: null,
};

describe('tool validation', () => {
  it('creates a reminder when the title is clear', () => {
    const result = validateToolCall({
      name: 'createReminder',
      args: { title: 'buy sunscreen', category: 'specific', dueAt: '2026-08-23' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.args.title).toBe('buy sunscreen');
  });

  it('rejects a generic supermarket place', () => {
    expect(isGenericPlaceName('the supermarket')).toBe(true);
    const result = validateToolCall({
      name: 'createReminder',
      args: { title: 'buy cat food', placeName: 'supermarket' },
    });
    expect(result).toMatchObject({ ok: false, reason: 'ambiguous' });
  });

  it('protects personal necessities from packing tools', () => {
    expect(
      protectNecessitiesFromPacking({
        name: 'removePackingItem',
        args: { id: 'p1', confirm: 'yes', deleteNecessity: true },
      }),
    ).toMatchObject({ ok: false, reason: 'protected' });
  });

  it('refuses destructive deletes without an id', () => {
    expect(validateToolCall({ name: 'deleteReminder', args: {} })).toMatchObject({
      ok: false,
      reason: 'destructive',
    });
  });
});

describe('local interpreter', () => {
  it('creates a reminder for tomorrow', () => {
    const reply = interpretLocally('remind me to buy sunscreen tomorrow', empty);
    expect(reply.toolCalls[0]?.name).toBe('createReminder');
    expect(reply.toolCalls[0]?.args.title).toBe('buy sunscreen');
    expect(reply.message).toContain('tomorrow');
  });

  it('asks which supermarket instead of inventing one', () => {
    const reply = interpretLocally('remind me to buy cat food when I am near the supermarket', empty);
    expect(reply.toolCalls).toEqual([]);
    expect(reply.message).toMatch(/which supermarket/i);
  });

  it('uses a single matching saved place instead of inventing one', () => {
    const reply = interpretLocally('remind me to buy dog food from the supermarket', {
      ...empty,
      places: [{ id: 'p1', name: 'Migros supermarket', type: 'shop' }],
    });
    expect(reply.toolCalls[0]).toMatchObject({
      name: 'createReminder',
      args: { placeName: 'Migros supermarket' },
    });
  });

  it('asks when more than one supermarket is saved', () => {
    const reply = interpretLocally('remind me to buy dog food from the supermarket', {
      ...empty,
      places: [
        { id: 'p1', name: 'Migros supermarket', type: 'shop' },
        { id: 'p2', name: 'Carrefour supermarket', type: 'shop' },
      ],
    });
    expect(reply.toolCalls).toEqual([]);
    expect(reply.message).toMatch(/which supermarket/i);
  });

  it('saves a café intention on the matching trip', () => {
    const reply = interpretLocally('I want to try this café in Antalya', empty);
    expect(reply.toolCalls[0]).toMatchObject({
      name: 'addIntention',
      args: { tripId: 'trip-1', type: 'food' },
    });
  });

  it('creates a trip from destination and dates', () => {
    const reply = interpretLocally("I'm going to Antalya September 15 to September 20", empty);
    expect(reply.toolCalls[0]?.name).toBe('createTrip');
    expect(reply.toolCalls[0]?.args).toMatchObject({
      destination: 'Antalya',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
    });
  });

  it('asks for dates instead of inventing them', () => {
    const reply = interpretLocally("I'm going to Antalya", empty);
    expect(reply.toolCalls).toEqual([]);
    expect(reply.message).toMatch(/when/i);
  });

  it('retrieves trips and packing from real context', () => {
    expect(interpretLocally("what's happening with my trip?", empty).toolCalls[0]?.name).toBe(
      'getUpcomingTrips',
    );
    expect(interpretLocally('what am I still missing?', empty).toolCalls[0]?.name).toBe('getPackingList');
    expect(interpretLocally('what do I need to remember today?', empty).toolCalls[0]?.name).toBe(
      'getTodayContext',
    );
    expect(interpretLocally('what should I pack for Antalya?', empty).toolCalls[0]?.name).toBe(
      'suggestPacking',
    );
  });

  it('handles an ambiguous command without acting', () => {
    const reply = interpretLocally('remember the stuff', empty);
    expect(reply.toolCalls).toEqual([]);
    expect(reply.message).toBe(AI_AMBIGUOUS_MESSAGE);
  });

  it('talks back to greetings instead of offering to save a reminder', () => {
    const hi = interpretLocally('hiiii', empty);
    expect(hi.toolCalls).toEqual([]);
    expect(hi.message).toMatch(/^hiiii ♡$/);
    expect(hi.message).not.toBe(AI_AMBIGUOUS_MESSAGE);

    const mood = interpretLocally('how are you?', empty);
    expect(mood.toolCalls).toEqual([]);
    expect(mood.message).toMatch(/sleepy|constellation/i);

    const thanks = interpretLocally('thank you', empty);
    expect(thanks.message).toBe('always ♡');

    const tired = interpretLocally("i'm tired", empty);
    expect(tired.toolCalls).toEqual([]);
    expect(tired.message).not.toBe(AI_AMBIGUOUS_MESSAGE);

    const ramble = interpretLocally('maybe later something', empty);
    expect(ramble.toolCalls).toEqual([]);
    expect(ramble.message).toBe(AI_GENTLE_HERE_MESSAGE);
  });
});

describe('AI unavailable fallback', () => {
  it('has a soft message', () => {
    expect(AI_UNAVAILABLE_MESSAGE).toMatch(/little brain/i);
  });
});
