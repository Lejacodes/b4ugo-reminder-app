import { hrefForDueReminder, hrefFromNotificationData } from '@/lib/notifications/routing';

describe('notification routing', () => {
  test('stale or malformed payloads do not produce a route', () => {
    expect(hrefFromNotificationData(null)).toBeNull();
    expect(hrefFromNotificationData(undefined)).toBeNull();
    expect(hrefFromNotificationData('boom')).toBeNull();
    expect(hrefFromNotificationData({ href: 12 })).toBeNull();
    expect(hrefFromNotificationData({ href: 'https://evil.example' })).toBeNull();
    expect(hrefFromNotificationData({ href: '../secrets' })).toBeNull();
    expect(hrefFromNotificationData({ href: '/unknown-place' })).toBeNull();
  });

  test('known reminder, trip, and packing hrefs are kept', () => {
    expect(hrefFromNotificationData({ href: '/reminders' })).toBe('/reminders');
    expect(hrefFromNotificationData({ href: '/before-ugo' })).toBe('/before-ugo');
    expect(hrefFromNotificationData({ href: '/on-the-way-back' })).toBe('/on-the-way-back');
    expect(hrefFromNotificationData({ href: '/trip/trip-1' })).toBe('/trip/trip-1');
    expect(hrefFromNotificationData({ href: '/trip/trip-1/packing' })).toBe('/trip/trip-1/packing');
  });

  test('dueAt reminders route to the relevant screen', () => {
    expect(hrefForDueReminder({ category: 'onTheWayBack' })).toBe('/on-the-way-back');
    expect(hrefForDueReminder({ category: 'beforeUgo' })).toBe('/before-ugo');
    expect(hrefForDueReminder({ category: 'specific', contextId: 'trip-abc' })).toBe('/trip/trip-abc');
    expect(hrefForDueReminder({ category: 'specific' })).toBe('/reminders');
  });
});
