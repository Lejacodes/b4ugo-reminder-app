import { departingTrips, isDepartingTrip, packingItemsForHomeBoard } from '@/lib/home/departing-trips';
import type { PackingItem, Trip } from '@/types/trip';

const today = '2026-09-08';

function trip(partial: Partial<Trip> & Pick<Trip, 'id' | 'startDate' | 'status'>): Trip {
  return {
    title: partial.title ?? 'Trip',
    destination: partial.destination ?? 'Somewhere',
    endDate: partial.endDate ?? null,
    durationDays: partial.durationDays ?? null,
    activity: null,
    season: null,
    accommodation: null,
    transportation: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

function packing(partial: Partial<PackingItem> & Pick<PackingItem, 'id' | 'tripId' | 'title'>): PackingItem {
  return {
    category: 'essentials',
    checked: false,
    source: 'user',
    reason: null,
    dismissed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('departing trips', () => {
  it('treats a planned trip leaving today as departing', () => {
    expect(isDepartingTrip(trip({ id: 't1', startDate: today, status: 'planned' }), today)).toBe(true);
  });

  it('treats an active trip as departing even when the start date is past', () => {
    expect(
      isDepartingTrip(trip({ id: 't1', startDate: '2026-09-01', status: 'active' }), today),
    ).toBe(true);
  });

  it('ignores tomorrow and archived trips', () => {
    expect(
      isDepartingTrip(trip({ id: 't1', startDate: '2026-09-09', status: 'planned' }), today),
    ).toBe(false);
    expect(isDepartingTrip(trip({ id: 't1', startDate: today, status: 'archived' }), today)).toBe(false);
  });

  it('returns only departing trips', () => {
    const trips = [
      trip({ id: 'today', startDate: today, status: 'planned' }),
      trip({ id: 'later', startDate: '2026-09-20', status: 'planned' }),
      trip({ id: 'live', startDate: '2026-09-01', status: 'active' }),
    ];
    expect(departingTrips(trips, today).map((item) => item.id)).toEqual(['today', 'live']);
  });
});

describe('packing items for the home board', () => {
  it('injects packing for a trip leaving today, including checked rows', () => {
    const trips = [trip({ id: 'antalya', startDate: today, status: 'planned' })];
    const items = packingItemsForHomeBoard(
      trips,
      [
        packing({ id: 'p1', tripId: 'antalya', title: 'Passport' }),
        packing({ id: 'p2', tripId: 'antalya', title: 'Sunscreen', checked: true }),
        packing({ id: 'p3', tripId: 'other', title: 'Charger' }),
      ],
      today,
    );
    expect(items.map((item) => item.title)).toEqual(['Passport', 'Sunscreen']);
    expect(items.find((item) => item.title === 'Sunscreen')?.checked).toBe(true);
  });

  it('injects incomplete packing for an active trip', () => {
    const items = packingItemsForHomeBoard(
      [trip({ id: 'live', startDate: '2026-09-01', status: 'active' })],
      [packing({ id: 'p1', tripId: 'live', title: 'Boarding pass' })],
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Boarding pass');
  });

  it('skips dismissed packing rows', () => {
    const items = packingItemsForHomeBoard(
      [trip({ id: 't1', startDate: today, status: 'planned' })],
      [packing({ id: 'p1', tripId: 't1', title: 'Hat', dismissed: true })],
      today,
    );
    expect(items).toEqual([]);
  });
});
