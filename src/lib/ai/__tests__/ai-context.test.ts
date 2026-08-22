import { buildAIContext } from '@/lib/ai/ai-context';
import type { Reminder } from '@/types/reminder';
import type { Trip } from '@/types/trip';

const reminder = (title: string): Reminder => ({
  id: `rem-${title}`,
  title,
  category: 'specific',
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
  season: 'summer',
  accommodation: 'hotel',
  transportation: 'plane',
  notes: null,
  status: 'planned',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('buildAIContext', () => {
  it('keeps a compact snapshot and omits closed reminders', () => {
    const snapshot = buildAIContext({
      reminders: [reminder('Sunscreen'), { ...reminder('Old'), status: 'done' }],
      personalNecessities: [{ id: 'n1', title: 'Keys', source: 'user', createdAt: '2026-01-01T00:00:00.000Z' }],
      upcomingTrips: [trip],
      packingItems: [],
      places: [],
      context: null,
      packingProgress: () => ({ packed: 0, total: 4 }),
    });
    expect(snapshot.reminders.map((item) => item.title)).toEqual(['Sunscreen']);
    expect(snapshot.necessities).toEqual(['Keys']);
    expect(snapshot.trips[0]).toMatchObject({ destination: 'Antalya', packed: 0, total: 4 });
    expect(snapshot.intentions).toEqual([]);
    expect(JSON.stringify(snapshot)).not.toMatch(/password|token|service.role/i);
  });
});
