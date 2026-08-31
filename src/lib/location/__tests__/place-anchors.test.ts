import {
  buildPlaceAnchors,
  formatPlaceNotificationCopy,
  PLACE_CLUSTER_METERS,
} from '@/lib/location/place-anchors';
import type { Reminder } from '@/types/reminder';

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

describe('buildPlaceAnchors', () => {
  test('groups multiple items at the same shop', () => {
    const anchors = buildPlaceAnchors([
      reminder({
        id: 'r1',
        title: 'cat food',
        category: 'onTheWayBack',
        location: { placeName: 'Migros', latitude: 41.01, longitude: 28.98, radiusMeters: null },
      }),
      reminder({
        id: 'r2',
        title: 'milk',
        category: 'onTheWayBack',
        location: { placeName: 'Migros', latitude: 41.01, longitude: 28.98, radiusMeters: null },
      }),
    ]);

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.items).toHaveLength(2);
    expect(anchors[0]?.placeName).toBe('Migros');
  });

  test('merges nearby coordinates into one anchor', () => {
    const anchors = buildPlaceAnchors([
      reminder({
        id: 'r1',
        title: 'batteries',
        category: 'specific',
        location: { placeName: 'PetZone', latitude: 41.01, longitude: 28.98, radiusMeters: null },
      }),
      reminder({
        id: 'r2',
        title: 'litter',
        category: 'specific',
        location: {
          placeName: 'PetZone Altunizade',
          latitude: 41.01 + PLACE_CLUSTER_METERS / 200_000,
          longitude: 28.98,
          radiusMeters: null,
        },
      }),
    ]);

    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.items).toHaveLength(2);
  });

  test('ignores reminders without coordinates', () => {
    const anchors = buildPlaceAnchors([
      reminder({
        id: 'r1',
        title: 'soap',
        category: 'onTheWayBack',
        location: { placeName: 'Migros', latitude: null, longitude: null, radiusMeters: null },
      }),
    ]);
    expect(anchors).toEqual([]);
  });
});

describe('formatPlaceNotificationCopy', () => {
  test('summarizes several items at once', () => {
    const copy = formatPlaceNotificationCopy({
      id: 'a1',
      placeName: 'Migros',
      latitude: 1,
      longitude: 2,
      radiusMeters: 250,
      items: [
        { reminderId: '1', title: 'cat food', href: '/on-the-way-back' },
        { reminderId: '2', title: 'milk', href: '/on-the-way-back' },
        { reminderId: '3', title: 'bread', href: '/on-the-way-back' },
      ],
    });
    expect(copy.title).toBe('At Migros');
    expect(copy.body).toBe('cat food · +2 more');
  });
});
