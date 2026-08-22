import { missingPacking, suggestPackingForTrip } from '@/lib/ai/ai-packing';
import type { PackingItem, Trip } from '@/types/trip';

const trip: Trip = {
  id: 'trip-1',
  title: 'Antalya vacation',
  destination: 'Antalya',
  startDate: '2026-09-15',
  endDate: '2026-09-20',
  durationDays: 5,
  activity: 'beach',
  season: 'summer',
  accommodation: 'hotel',
  transportation: 'plane',
  notes: null,
  status: 'planned',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AI packing suggestions', () => {
  it('suggests beach items without touching existing titles or necessities', () => {
    const existing: PackingItem[] = [
      {
        id: 'p1',
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
    ];
    const suggestions = suggestPackingForTrip({
      trip,
      personalNecessities: [{ id: 'n1', title: 'Keys', source: 'user', createdAt: '2026-01-01T00:00:00.000Z' }],
      packingItems: existing,
      weather: { isLive: true, rainLikely: false, temperatureC: 30, summary: '30°' },
    });
    expect(suggestions.some((item) => item.title === 'Passport')).toBe(false);
    expect(suggestions.some((item) => /swim|sunscreen|light clothing/i.test(item.title))).toBe(true);
    expect(suggestions.every((item) => item.reason)).toBe(true);
  });

  it('lists only unfinished packing items', () => {
    const items: PackingItem[] = [
      {
        id: 'p1',
        tripId: 'trip-1',
        title: 'Sunscreen',
        category: 'health',
        checked: false,
        source: 'user',
        reason: null,
        dismissed: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'p2',
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
    ];
    expect(missingPacking(items, 'trip-1').map((item) => item.title)).toEqual(['Sunscreen']);
  });
});
