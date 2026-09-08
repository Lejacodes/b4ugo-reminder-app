import { buildDepartureBoard } from '@/lib/home/departure-board';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';

const necessity: PersonalNecessity = {
  id: 'nec-keys',
  title: 'Keys',
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const context: BeforeUgoContext = {
  id: 'ctx-1',
  destination: 'Uni',
  purpose: 'class',
  person: null,
  dateTime: null,
  createdAt: '2026-09-07T08:00:00.000Z',
};

function reminder(partial: Partial<Reminder> & Pick<Reminder, 'id' | 'title'>): Reminder {
  return {
    category: 'beforeUgo',
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    source: 'user',
    layer: 'always',
    contextId: 'ctx-1',
    reason: null,
    location: null,
    person: null,
    dueAt: null,
    ...partial,
  };
}

describe('departure board', () => {
  it('checks necessities only for this session when no trip is active', () => {
    const original = { ...necessity };
    const board = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [necessity],
      weatherItems: [
        {
          id: 'umbrella',
          title: 'Umbrella',
          badge: 'Rain Expected',
          badgeIcon: 'rain',
          reason: 'rain expected today',
          rule: 'rain',
        },
      ],
      sessionChecks: { 'nec:nec-keys': true },
      dismissedWeather: [],
    });

    expect(necessity).toEqual(original);
    const keys = board.find((item) => item.necessityId === 'nec-keys');
    expect(keys?.persistKind).toBe('session');
    expect(keys?.checked).toBe(true);
    expect(board.find((item) => item.weatherId === 'umbrella')?.badge).toBe('Rain Expected');
  });

  it('uses trip extras without hiding or mutating necessities', () => {
    const original = { ...necessity };
    const board = buildDepartureBoard({
      context,
      tripReminders: [
        reminder({ id: 'rem-keys', title: 'Keys', status: 'done', layer: 'always' }),
        reminder({
          id: 'rem-laptop',
          title: 'Laptop',
          layer: 'thisTrip',
        }),
        reminder({
          id: 'rem-rain',
          title: 'Umbrella',
          source: 'weather',
          layer: 'suggestion',
          reason: 'rain expected today',
        }),
      ],
      necessities: [necessity],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
    });

    expect(necessity).toEqual(original);
    const keys = board.find((item) => item.necessityId === 'nec-keys');
    expect(keys?.persistKind).toBe('session');
    expect(keys?.checked).toBe(false);
    expect(board.find((item) => item.title === 'Laptop')?.persistKind).toBe('reminder');
    expect(board.find((item) => item.title === 'Umbrella')?.badge).toBe('Rain Expected');
  });

  it('hides necessities cleared from this session', () => {
    const board = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [necessity],
      weatherItems: [],
      sessionChecks: { 'nec:nec-keys': true },
      dismissedWeather: [],
      cleared: ['nec:nec-keys'],
    });
    expect(board).toEqual([]);
  });

  it('hides dismissed weather suggestions for the session', () => {
    const board = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [],
      weatherItems: [
        {
          id: 'umbrella',
          title: 'Umbrella',
          badge: 'Rain Expected',
          badgeIcon: 'rain',
          reason: 'rain expected today',
          rule: 'rain',
        },
      ],
      sessionChecks: {},
      dismissedWeather: ['umbrella'],
    });
    expect(board).toEqual([]);
  });

  it('injects incomplete packing for a trip leaving today and skips cloned this-trip extras', () => {
    const board = buildDepartureBoard({
      context,
      tripReminders: [
        reminder({
          id: 'rem-passport',
          title: 'Passport',
          layer: 'thisTrip',
        }),
        reminder({
          id: 'rem-gum',
          title: 'Gum',
          layer: 'thisTrip',
        }),
      ],
      necessities: [necessity],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
      packingItems: [
        {
          id: 'pack-1',
          tripId: 'trip-1',
          title: 'Passport',
          category: 'documents',
          checked: false,
          source: 'user',
          reason: null,
          dismissed: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const passport = board.find((item) => item.title === 'Passport');
    expect(passport?.persistKind).toBe('packing');
    expect(passport?.packingItemId).toBe('pack-1');
    expect(board.find((item) => item.title === 'Gum')).toBeUndefined();
  });

  it('keeps checked packing on the board so it can be swipe-deleted', () => {
    const board = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
      packingItems: [
        {
          id: 'pack-1',
          tripId: 'trip-1',
          title: 'Passport',
          category: 'documents',
          checked: true,
          source: 'user',
          reason: null,
          dismissed: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(board).toHaveLength(1);
    expect(board[0]?.checked).toBe(true);
    expect(board[0]?.packingItemId).toBe('pack-1');
  });

  it('hides weekday-only necessities on the weekend', () => {
    const studentId: PersonalNecessity = {
      id: 'nec-id',
      title: 'Student ID',
      source: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
      activeDays: [1, 2, 3, 4, 5],
    };
    const weekday = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [studentId],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
      dayOfWeek: 1,
    });
    const weekend = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [studentId],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
      dayOfWeek: 6,
    });

    expect(weekday.find((item) => item.title === 'Student ID')).toBeDefined();
    expect(weekend.find((item) => item.title === 'Student ID')).toBeUndefined();
  });

  it('shows necessities without activeDays every day', () => {
    const board = buildDepartureBoard({
      context: null,
      tripReminders: [],
      necessities: [necessity],
      weatherItems: [],
      sessionChecks: {},
      dismissedWeather: [],
      dayOfWeek: 0,
    });
    expect(board.find((item) => item.title === 'Keys')).toBeDefined();
  });
});
