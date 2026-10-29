import { buildConstellation, CONSTELLATION_MAX, PIXEL_COLORS } from '@/lib/ai/constellation';
import { littleGuyWhisper, moodFromSituation } from '@/lib/ai/little-guy-mood';
import type { PersonalNecessity, Reminder } from '@/types/reminder';
import type { PackingItem, Trip } from '@/types/trip';

const TODAY = '2026-09-08';

const reminder = (
  title: string,
  category: Reminder['category'] = 'specific',
  extra: Partial<Reminder> = {},
): Reminder => ({
  id: extra.id ?? `rem-${title}`,
  title,
  category,
  status: extra.status ?? 'open',
  createdAt: extra.createdAt ?? '2026-01-01T00:00:00.000Z',
  updatedAt: extra.updatedAt ?? '2026-01-01T00:00:00.000Z',
  source: extra.source ?? 'user',
  layer: extra.layer ?? null,
  contextId: extra.contextId ?? null,
  reason: extra.reason ?? null,
  location: extra.location ?? null,
  person: extra.person ?? null,
  dueAt: extra.dueAt ?? null,
});

const necessity = (title: string, id = `nec-${title}`): PersonalNecessity => ({
  id,
  title,
  source: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
});

const trip = (partial: Partial<Trip> & Pick<Trip, 'id' | 'startDate' | 'status'>): Trip => ({
  title: partial.title ?? 'Trip',
  destination: partial.destination ?? 'Antalya',
  endDate: partial.endDate ?? '2026-09-20',
  durationDays: partial.durationDays ?? 5,
  activity: partial.activity ?? 'beach',
  season: null,
  accommodation: null,
  transportation: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...partial,
});

const packing = (
  partial: Partial<PackingItem> & Pick<PackingItem, 'id' | 'tripId' | 'title'>,
): PackingItem => ({
  category: 'essentials',
  checked: false,
  source: 'user',
  reason: null,
  dismissed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...partial,
});

const futureTrip = trip({
  id: 'trip-1',
  title: 'Antalya vacation',
  destination: 'Antalya',
  startDate: '2026-09-15',
  status: 'planned',
});

describe('constellation', () => {
  it('makes one spark per unresolved Before U Go, errand, and today packing item', () => {
    const pixels = buildConstellation({
      reminders: [
        reminder('Charger', 'beforeUgo'),
        reminder('cat food', 'onTheWayBack'),
        reminder('done extra', 'beforeUgo', { status: 'done' }),
      ],
      necessities: [necessity('Keys', 'keys')],
      packingItems: [
        packing({ id: 'p1', tripId: 'today', title: 'Passport' }),
        packing({ id: 'p2', tripId: 'today', title: 'Sunscreen', checked: true }),
      ],
      trips: [trip({ id: 'today', startDate: TODAY, status: 'planned' })],
      today: TODAY,
    });

    expect(pixels.map((item) => item.label).sort()).toEqual(['Charger', 'Keys', 'Passport', 'cat food']);
    expect(pixels.find((item) => item.label === 'Passport')?.kind).toBe('due');
    expect(pixels.find((item) => item.label === 'cat food')?.kind).toBe('errand');
    expect(pixels.find((item) => item.label === 'Keys')?.kind).toBe('necessity');
    expect(pixels.find((item) => item.label === 'Charger')?.kind).toBe('due');
    expect(pixels.some((item) => item.label === 'Sunscreen')).toBe(false);
    expect(pixels.some((item) => item.id.startsWith('trip:'))).toBe(false);
  });

  it('does not invent pixels when nothing is waiting', () => {
    expect(buildConstellation({ reminders: [], trips: [], packingItems: [], today: TODAY })).toEqual([]);
  });

  it('colors overdue coral, nearby errands green, and future packing blue', () => {
    const pixels = buildConstellation({
      reminders: [
        reminder('Pay rent', 'specific', { dueAt: '2026-09-01' }),
        reminder('Pharmacy', 'onTheWayBack', {
          location: { placeName: 'CVS', latitude: 1, longitude: 2, radiusMeters: 80 },
        }),
      ],
      packingItems: [packing({ id: 'p-hat', tripId: 'trip-1', title: 'Sun hat' })],
      trips: [futureTrip],
      today: TODAY,
      departureActive: false,
    });

    expect(pixels.find((item) => item.label === 'Pay rent')?.kind).toBe('urgent');
    expect(pixels.find((item) => item.label === 'Pharmacy')?.kind).toBe('nearby');
    expect(pixels.find((item) => item.label === 'Sun hat')?.kind).toBe('trip');
    expect(PIXEL_COLORS.urgent).toBe('#E56B6F');
    expect(PIXEL_COLORS.nearby).toBe('#2A9D8F');
    expect(PIXEL_COLORS.trip).toBe('#457B9D');
  });

  it('drops a spark when the matching item is checked or deleted', () => {
    const open = buildConstellation({
      reminders: [reminder('Milk', 'onTheWayBack')],
      necessities: [necessity('Keys', 'keys')],
      today: TODAY,
    });
    const afterCheck = buildConstellation({
      reminders: [reminder('Milk', 'onTheWayBack')],
      necessities: [necessity('Keys', 'keys')],
      sessionChecks: { 'nec:keys': true },
      today: TODAY,
    });
    const afterDelete = buildConstellation({
      reminders: [],
      necessities: [necessity('Keys', 'keys')],
      sessionChecks: { 'nec:keys': true },
      today: TODAY,
    });

    expect(open).toHaveLength(2);
    expect(afterCheck.map((item) => item.label)).toEqual(['Milk']);
    expect(afterDelete).toEqual([]);
  });

  it('caps the sky so a long list does not crowd Little Guy', () => {
    const pixels = buildConstellation({
      reminders: Array.from({ length: 20 }, (_, i) => reminder(`errand ${i}`, 'onTheWayBack')),
      today: TODAY,
    });
    expect(pixels).toHaveLength(CONSTELLATION_MAX);
    expect(pixels.length).toBeLessThanOrEqual(10);
  });
});

describe('Little Guy mood', () => {
  it('thinks while processing and sleeps when nothing needs attention', () => {
    expect(
      moodFromSituation({
        today: TODAY,
        processing: true,
        reminders: [],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('thinking');
    expect(
      moodFromSituation({
        today: TODAY,
        reminders: [],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('sleepy');
    expect(
      moodFromSituation({
        today: TODAY,
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
        today: TODAY,
        reminders: [],
        upcomingTrips: [futureTrip],
        unfinishedPacking: 3,
      }),
    ).toBe('thinking');
  });

  it('looks preoccupied when a lot of reminders are open', () => {
    expect(
      moodFromSituation({
        today: TODAY,
        reminders: ['a', 'b', 'c', 'd'].map((title) => reminder(title)),
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('thinking');
  });

  it('is quietly attentive when a couple of things are waiting', () => {
    expect(
      moodFromSituation({
        today: TODAY,
        reminders: [reminder('Sunscreen')],
        upcomingTrips: [],
        unfinishedPacking: 0,
      }),
    ).toBe('remembering');
  });

  it('is proud once a trip is fully packed and nothing is open', () => {
    expect(
      moodFromSituation({
        today: TODAY,
        reminders: [],
        upcomingTrips: [futureTrip],
        unfinishedPacking: 0,
      }),
    ).toBe('proud');
  });

  it('uses the injected date for past, current, and future trip signals', () => {
    const past = trip({ id: 'past', startDate: '2026-09-01', endDate: '2026-09-03', status: 'planned' });
    const current = trip({ id: 'current', startDate: TODAY, endDate: '2026-09-10', status: 'planned' });
    const future = trip({ id: 'future', startDate: '2026-09-10', endDate: '2026-09-12', status: 'planned' });

    const base = { reminders: [], unfinishedPacking: 0, today: TODAY };
    expect(moodFromSituation({ ...base, upcomingTrips: [past] })).toBe('proud');
    expect(littleGuyWhisper({ ...base, unfinishedPacking: 2, upcomingTrips: [past] })).toBeNull();
    expect(moodFromSituation({ ...base, upcomingTrips: [current] })).toBe('excited');
    expect(littleGuyWhisper({ ...base, upcomingTrips: [current] })).toBe('your trip is today ♡');
    expect(moodFromSituation({ ...base, upcomingTrips: [future] })).toBe('excited');
    expect(littleGuyWhisper({ ...base, upcomingTrips: [future] })).toBe('your trip is in 2 days ♡');
  });
});
