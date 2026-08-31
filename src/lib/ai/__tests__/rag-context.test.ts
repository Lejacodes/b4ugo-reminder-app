import { formatContextForModel } from '@/lib/ai/rag-context';
import { parseRelativeDueAt } from '@/lib/ai/parse-when';
import type { AIContextSnapshot } from '@/lib/ai/types';

const snapshot: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [
    {
      id: 'r1',
      title: 'Keys',
      category: 'beforeUgo',
      dueAt: null,
      place: null,
    },
  ],
  necessities: ['Keys', 'Charger'],
  trips: [
    {
      id: 'trip-1',
      title: 'Antalya',
      destination: 'Antalya',
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      durationDays: 5,
      activity: 'beach',
      packed: 1,
      total: 3,
    },
  ],
  places: [{ id: 'p1', name: 'Migros', type: 'shop' }],
  intentions: [],
  packing: [
    { id: 'pk1', tripId: 'trip-1', title: 'Passport', checked: false },
    { id: 'pk2', tripId: 'trip-1', title: 'Phone', checked: true },
  ],
  weather: null,
  activeDestination: null,
};

describe('formatContextForModel', () => {
  it('includes ids and never-invent rules', () => {
    const block = formatContextForModel(snapshot);
    expect(block).toContain('B4UGO MEMORY');
    expect(block).toContain('r1 | Keys');
    expect(block).toContain('pk1 | trip:trip-1 | Passport | open');
    expect(block).toContain('Never invent ids');
    expect(block).toContain('you MUST call the matching tool');
  });

  it('states when lists are empty', () => {
    const empty = formatContextForModel({
      ...snapshot,
      reminders: [],
      trips: [],
      packing: [],
    });
    expect(empty).toContain('OPEN REMINDERS: none');
    expect(empty).toContain('UPCOMING TRIPS: none');
  });
});

describe('parseRelativeDueAt', () => {
  it('parses in N minutes', () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const due = parseRelativeDueAt('make a reminder in 5 minutes', now);
    expect(due).toBe('2026-08-22T12:05:00.000Z');
  });

  it('parses in N hours', () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const due = parseRelativeDueAt('remind me in 2 hours', now);
    expect(due).toBe('2026-08-22T14:00:00.000Z');
  });
});
