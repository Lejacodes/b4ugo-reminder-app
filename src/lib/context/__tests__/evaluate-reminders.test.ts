import { evaluateReminders } from '@/lib/context/evaluate-reminders';
import { necessityOpenForTrip, packedTitlesForTrip } from '@/lib/context/necessities';
import type { PersonalNecessity, Reminder } from '@/types/reminder';
import type { PackingItem } from '@/types/trip';

function reminder(partial: Partial<Reminder> & Pick<Reminder, 'id' | 'title' | 'category'>): Reminder {
  return {
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
    ...partial,
  };
}

const charger: PersonalNecessity = {
  id: 'nec-charger',
  title: 'Charger',
  source: 'learned',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('evaluateReminders', () => {
  test('1. Before U Go reminder matches leaving-home context', () => {
    const keys = reminder({ id: 'r1', title: 'Keys', category: 'beforeUgo', layer: 'always', contextId: 'dep-1' });
    const ranked = evaluateReminders({
      context: { kind: 'leavingHome', departureId: 'dep-1' },
      reminders: [keys],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: true,
    });
    expect(ranked.map((item) => item.title)).toEqual(['Keys']);
    expect(ranked[0]?.priority).toBe(1);
  });

  test('2. Specific-place reminder does not match unrelated places', () => {
    const catFood = reminder({
      id: 'r2',
      title: 'Buy cat food',
      category: 'onTheWayBack',
      location: { placeName: 'PetZone', latitude: 1, longitude: 1, radiusMeters: 150 },
    });
    const ranked = evaluateReminders({
      context: { kind: 'specificPlace', placeName: 'Post Office' },
      reminders: [catFood],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: false,
    });
    expect(ranked).toEqual([]);
  });

  test('3. Specific-place reminder matches the correct place', () => {
    const catFood = reminder({
      id: 'r3',
      title: 'Buy cat food',
      category: 'onTheWayBack',
      location: { placeName: 'PetZone', latitude: 1, longitude: 1, radiusMeters: 150 },
    });
    const ranked = evaluateReminders({
      context: { kind: 'specificPlace', placeName: 'PetZone' },
      reminders: [catFood],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: false,
    });
    expect(ranked.map((item) => item.title)).toEqual(['Buy cat food']);
  });

  test('4. Trip reminder only matches its associated trip', () => {
    const packing: PackingItem = {
      id: 'p1',
      tripId: 'trip-a',
      title: 'Passport',
      category: 'documents',
      checked: false,
      source: 'generated',
      reason: null,
      dismissed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const other = evaluateReminders({
      context: { kind: 'trip', tripId: 'trip-b' },
      reminders: [],
      personalNecessities: [],
      packingItems: [packing],
      routinesEnabled: false,
      preferContextual: true,
    });
    const mine = evaluateReminders({
      context: { kind: 'trip', tripId: 'trip-a' },
      reminders: [],
      personalNecessities: [],
      packingItems: [packing],
      routinesEnabled: false,
      preferContextual: true,
    });
    expect(other).toEqual([]);
    expect(mine.map((item) => item.title)).toEqual(['Passport']);
  });

  test('5. Completed reminders are excluded', () => {
    const done = reminder({ id: 'r5', title: 'Keys', category: 'beforeUgo', status: 'done', contextId: 'dep-1' });
    const ranked = evaluateReminders({
      context: { kind: 'leavingHome', departureId: 'dep-1' },
      reminders: [done],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: true,
    });
    expect(ranked).toEqual([]);
  });

  test('6. Personal necessity completion is trip-specific', () => {
    const packedA = packedTitlesForTrip(
      [
        {
          id: 'p-charger',
          tripId: 'trip-a',
          title: 'Charger',
          category: 'essentials',
          checked: true,
          source: 'user',
          reason: null,
          dismissed: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      'trip-a',
    );
    const packedB = packedTitlesForTrip([], 'trip-b');
    expect(necessityOpenForTrip(charger, packedA)).toBe(false);
    expect(necessityOpenForTrip(charger, packedB)).toBe(true);
  });

  test('9. Reminder engine does not return duplicates', () => {
    const keys = reminder({ id: 'r9', title: 'Keys', category: 'beforeUgo', layer: 'always', contextId: 'dep-1' });
    const ranked = evaluateReminders({
      context: { kind: 'leavingHome', departureId: 'dep-1' },
      reminders: [keys],
      personalNecessities: [{ id: 'nec-keys', title: 'Keys', source: 'learned', createdAt: '2026-01-01T00:00:00.000Z' }],
      packingItems: [],
      routinesEnabled: true,
      preferContextual: true,
    });
    expect(ranked.filter((item) => item.title === 'Keys')).toHaveLength(1);
    expect(ranked[0]?.priority).toBe(1);
  });

  test('10. Missing location does not break evaluation', () => {
    const ranked = evaluateReminders({
      context: { kind: 'always' },
      reminders: [reminder({ id: 'r10', title: 'Call Sam', category: 'specific' })],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: true,
      preferContextual: true,
    });
    expect(ranked.map((item) => item.title)).toEqual(['Call Sam']);
  });
});
