import { evaluateReminders } from '@/lib/context/evaluate-reminders';
import {
  canDeliverNotification,
  contextNotificationKey,
  remindersToNotify,
  shouldWatchLocation,
} from '@/lib/notifications/context-notify';
import { rememberNotification, notificationKey } from '@/lib/notifications/dedupe';
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

const keys = reminder({
  id: 'r1',
  title: 'Keys',
  category: 'beforeUgo',
  contextId: 'dep-1',
});

describe('notification permission', () => {
  test('denied or restricted permission does not deliver', () => {
    expect(canDeliverNotification('denied')).toBe(false);
    expect(canDeliverNotification('restricted')).toBe(false);
    expect(canDeliverNotification('undetermined')).toBe(false);
    expect(canDeliverNotification('granted')).toBe(true);
  });
});

describe('location-driven notification policy', () => {
  test('location reminders disabled → no location watch', () => {
    expect(
      shouldWatchLocation({
        signedIn: true,
        locationRemindersEnabled: false,
        preferContextual: true,
        platform: 'ios',
      }),
    ).toBe(false);
  });

  test('web never starts native location watch', () => {
    expect(
      shouldWatchLocation({
        signedIn: true,
        locationRemindersEnabled: true,
        preferContextual: true,
        platform: 'web',
      }),
    ).toBe(false);
  });
});

describe('context notification selection', () => {
  const leaving = { kind: 'leavingHome' as const, departureId: 'dep-1' };
  const place = { kind: 'specificPlace' as const, placeName: 'PetZone' };

  test('same reminder + same context does not notify again', () => {
    const ranked = evaluateReminders({
      context: leaving,
      reminders: [keys],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: true,
    });
    const contextKey = contextNotificationKey(leaving);
    const first = remindersToNotify(ranked, [], contextKey, 1_000);
    expect(first.map((item) => item.id)).toEqual(['r1']);

    const after = rememberNotification([], notificationKey('r1', contextKey), 1_000);
    expect(remindersToNotify(ranked, after, contextKey, 1_000 + 60_000)).toEqual([]);
  });

  test('different contexts can notify the same reminder independently', () => {
    const catFood = reminder({
      id: 'r2',
      title: 'Keys',
      category: 'onTheWayBack',
      location: { placeName: 'PetZone', latitude: 1, longitude: 1, radiusMeters: 150 },
    });
    const rankedPlace = evaluateReminders({
      context: place,
      reminders: [catFood],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: false,
    });
    const leavingKey = contextNotificationKey(leaving);
    const placeKey = contextNotificationKey(place);
    const afterLeaving = rememberNotification([], notificationKey('r2', leavingKey), 1_000);
    expect(remindersToNotify(rankedPlace, afterLeaving, placeKey, 1_001).map((item) => item.id)).toEqual([
      'r2',
    ]);
  });

  test('completed reminder does not notify', () => {
    const ranked = evaluateReminders({
      context: leaving,
      reminders: [{ ...keys, status: 'done' }],
      personalNecessities: [],
      packingItems: [],
      routinesEnabled: false,
      preferContextual: true,
    });
    expect(remindersToNotify(ranked, [], contextNotificationKey(leaving))).toEqual([]);
  });
});
