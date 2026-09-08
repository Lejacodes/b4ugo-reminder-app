import { Platform } from 'react-native';

import { appNotificationService } from '@/lib/notifications/notification-service';
import { preferencesStorage, scopedKey, STORAGE_KEYS } from '@/lib/storage/preferences-storage';

export const DEPARTURE_WIFI_COOLDOWN_MS = 3 * 60 * 60 * 1000;
export const DEPARTURE_WIFI_NOTIFICATION_KEY = 'wifi-departure';
export const MORNING_DEPARTURE_START_HOUR = 7;
export const MORNING_DEPARTURE_END_HOUR = 11;

export type NetworkKind = 'wifi' | 'cellular' | 'offline' | 'other';

export function networkKindFromState(state: {
  type?: string | null;
  isConnected?: boolean | null;
}): NetworkKind {
  if (state.isConnected === false || state.type === 'none') return 'offline';
  if (state.type === 'wifi') return 'wifi';
  if (state.type === 'cellular') return 'cellular';
  return 'other';
}

export function isMorningDepartureWindow(now: Date): boolean {
  const hour = now.getHours();
  return hour >= MORNING_DEPARTURE_START_HOUR && hour < MORNING_DEPARTURE_END_HOUR;
}

export function isWifiDepartureTransition(from: NetworkKind, to: NetworkKind): boolean {
  return from === 'wifi' && (to === 'cellular' || to === 'offline');
}

type CooldownRecord = {
  at: number;
};

async function loadCooldown(userId: string): Promise<number | null> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.departureTriggerCooldown, userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CooldownRecord;
    return typeof parsed.at === 'number' ? parsed.at : null;
  } catch {
    return null;
  }
}

async function saveCooldown(userId: string, at: number): Promise<void> {
  await preferencesStorage.setItem(
    scopedKey(STORAGE_KEYS.departureTriggerCooldown, userId),
    JSON.stringify({ at } satisfies CooldownRecord),
  );
}

export async function shouldFireWifiDepartureTrigger(
  userId: string,
  now = Date.now(),
): Promise<boolean> {
  const previous = await loadCooldown(userId);
  if (previous == null) return true;
  return now - previous >= DEPARTURE_WIFI_COOLDOWN_MS;
}

export async function notifyWifiDepartureTrigger(userId: string, now = Date.now()): Promise<void> {
  await appNotificationService.notifyNow({
    id: DEPARTURE_WIFI_NOTIFICATION_KEY,
    title: 'Heading out?',
    body: 'Check your doorway list before you go.',
    href: '/before-ugo',
  });
  await saveCooldown(userId, now);
}

export async function handleWifiDepartureTransition(input: {
  userId: string;
  from: NetworkKind;
  to: NetworkKind;
  now?: Date;
  pushEnabled?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (input.pushEnabled === false) return false;
  if (!isWifiDepartureTransition(input.from, input.to)) return false;

  const now = input.now ?? new Date();
  if (!isMorningDepartureWindow(now)) return false;
  if (!(await shouldFireWifiDepartureTrigger(input.userId, now.getTime()))) return false;

  await notifyWifiDepartureTrigger(input.userId, now.getTime());
  return true;
}

/**
 * Watch Wi-Fi → cellular/offline transitions during the morning departure window.
 */
export function watchWifiDepartureTrigger(input: {
  userId: string;
  pushEnabled: boolean;
}): () => void {
  if (Platform.OS === 'web') return () => undefined;

  let previous: NetworkKind = 'other';
  let unsub: (() => void) | undefined;

  void import('@react-native-community/netinfo')
    .then((NetInfo) => {
      return NetInfo.default.fetch().then((state) => {
        previous = networkKindFromState(state);
        unsub = NetInfo.default.addEventListener((state) => {
          const next = networkKindFromState(state);
          void handleWifiDepartureTransition({
            userId: input.userId,
            from: previous,
            to: next,
            pushEnabled: input.pushEnabled,
          });
          previous = next;
        });
      });
    })
    .catch(() => undefined);

  return () => {
    unsub?.();
  };
}
