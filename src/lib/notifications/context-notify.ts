import type { AppContext, RankedReminder } from '@/types/context';

import { notificationKey, shouldNotify, type NotificationRecord } from './dedupe';

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

export function contextNotificationKey(context: AppContext): string {
  return [context.kind, context.placeId, context.placeName, context.tripId, context.departureId]
    .filter(Boolean)
    .join(':');
}

export function remindersToNotify(
  ranked: RankedReminder[],
  records: NotificationRecord[],
  contextKey: string,
  now = Date.now(),
): RankedReminder[] {
  return ranked.filter((item) => shouldNotify(records, notificationKey(item.id, contextKey), now));
}

export function canDeliverNotification(status: NotificationPermissionStatus): boolean {
  return status === 'granted';
}

export function shouldWatchLocation(input: {
  signedIn: boolean;
  locationRemindersEnabled: boolean;
  preferContextual: boolean;
  platform: string;
}): boolean {
  if (input.platform === 'web') return false;
  if (!input.signedIn) return false;
  if (!input.locationRemindersEnabled) return false;
  if (!input.preferContextual) return false;
  return true;
}
