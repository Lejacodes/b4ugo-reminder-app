import { buildConstellation } from '@/lib/ai/constellation';
import { moodFromSituation } from '@/lib/ai/little-guy-mood';
import type { Reminder } from '@/types/reminder';
import type { Trip } from '@/types/trip';

const reminder = (title: string, category: Reminder['category'] = 'specific'): Reminder => ({
  id: `rem-${title}`,
  title,
  category,
  status: 'open',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  source: 'user',
  layer: null,
  contextId: null,
  reason: null,
  location: null,
  person: null,
  dueAt: null,
});

const trip: Trip = {
  id: 'trip-1',
  title: 'Antalya vacation',
  destination: 'Antalya',
  startDate: '2026-09-15',
  endDate: '2026-09-20',
  durationDays: 5,
  activity: 'beach',
  season: null,
  accommodation: null,
  transportation: null,
  notes: null,
  status: 'planned',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('constellation', () => {
  it('builds pixels from real reminders and trips', () => {
    const pixels = buildConstellation({
      reminders: [reminder('buy cat food', 'onTheWayBack'), reminder('Charger', 'beforeUgo')],
      upcomingTrips: [trip],
      unfinishedPacking: 3,
    });
    expect(pixels.some((item) => item.kind === 'trip')).toBe(true);
    expect(pixels.some((item) => item.kind === 'buy')).toBe(true);
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.length).toBeLessThanOrEqual(8);
  });

  it('does not invent pixels when nothing is waiting', () => {
    expect(buildConstellation({ reminders: [], upcomingTrips: [], unfinishedPacking: 0 })).toEqual([]);
  });
});

describe('Little Guy mood', () => {
  it('thinks while processing and sleeps when nothing needs attention', () => {
    expect(
      moodFromSituation({
        processing: true,
        reminders: [],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('thinking');
    expect(
      moodFromSituation({
        reminders: [],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('sleepy');
    expect(
      moodFromSituation({
        justSaved: true,
        reminders: [reminder('Sunscreen')],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('happy');
  });

  it('looks preoccupied when packing is unfinished', () => {
    expect(
      moodFromSituation({
        reminders: [],
        upcomingTrips: [trip],
        unfinishedPacking: 3,
      }),
    ).toBe('thinking');
  });

  it('looks preoccupied when a lot of reminders are open', () => {
    expect(
      moodFromSituation({
        reminders: ['a', 'b', 'c', 'd'].map((title) => reminder(title)),
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('thinking');
  });

  it('is quietly attentive when a couple of things are waiting', () => {
    expect(
      moodFromSituation({
        reminders: [reminder('Sunscreen')],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('remembering');
  });

  it('is proud once a trip is fully packed and nothing is open', () => {
    expect(
      moodFromSituation({
        reminders: [],
        upcomingTrips: [trip],
        unfinishedPacking: 0,
      }),
    ).toBe('proud');
  });
});
