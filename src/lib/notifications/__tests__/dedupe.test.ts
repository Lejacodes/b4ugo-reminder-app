import { notificationKey, rememberNotification, shouldNotify } from '@/lib/notifications/dedupe';

describe('notification dedupe', () => {
  test('8. Notification deduplication/cooldown logic works', () => {
    const key = notificationKey('rem-1', 'leavingHome');
    expect(shouldNotify([], key, 1_000)).toBe(true);

    const afterFirst = rememberNotification([], key, 1_000);
    expect(shouldNotify(afterFirst, key, 1_000 + 60_000)).toBe(false);
    expect(shouldNotify(afterFirst, key, 1_000 + 2 * 60 * 60 * 1000)).toBe(true);

    const other = notificationKey('rem-2', 'leavingHome');
    expect(shouldNotify(afterFirst, other, 1_001)).toBe(true);

    const otherContext = notificationKey('rem-1', 'specificPlace:PetZone');
    expect(shouldNotify(afterFirst, otherContext, 1_001)).toBe(true);
  });
});
