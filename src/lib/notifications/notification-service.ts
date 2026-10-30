import { Platform } from 'react-native';

import type { RankedReminder } from '@/types/context';

export type NotificationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

export type ScheduledReminder = {
  id: string;
  title: string;
  body: string;
  href: string;
  at: Date;
};

export type AppNotificationService = {
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<NotificationPermissionStatus>;
  isAvailable(): Promise<boolean>;
  notifyNow(input: { id: string; title: string; body: string; href: string }): Promise<void>;
  schedule(input: ScheduledReminder): Promise<void>;
  cancel(id: string): Promise<void>;
  listScheduledIds(): Promise<string[]>;
};

const ANDROID_CHANNEL_ID = 'blugo-reminders';

function mapStatus(value: string | undefined): NotificationPermissionStatus {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  if (value === 'restricted') return 'restricted';
  return 'undetermined';
}

async function loadNotifications() {
  return import('expo-notifications');
}

let handlerReady = false;
let channelReady = false;

async function configureHandler(): Promise<void> {
  if (Platform.OS === 'web' || handlerReady) return;
  try {
    const Notifications = await loadNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerReady = true;
  } catch {
    handlerReady = false;
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    const Notifications = await loadNotifications();
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    channelReady = true;
  } catch {
    channelReady = false;
  }
}

export function copyForReminder(item: RankedReminder, contextLabel?: string): { title: string; body: string } {
  if (item.href.startsWith('/before-ugo') || (item.source === 'routine' && item.href === '/before-ugo')) {
    return { title: 'Before you go', body: item.title };
  }
  if (item.href === '/on-the-way-back') {
    return { title: contextLabel ? `Near ${contextLabel}` : 'Along your way', body: item.title };
  }
  if (item.href.startsWith('/trip/') && item.href.endsWith('/packing')) {
    return { title: 'Packing', body: item.title };
  }
  if (item.href.startsWith('/trip/')) {
    return { title: 'This trip', body: item.title };
  }
  return { title: contextLabel ? `Near ${contextLabel}` : 'B4UGO', body: item.title };
}

export class ExpoNotificationService implements AppNotificationService {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      await configureHandler();
      const Notifications = await loadNotifications();
      const current = await Notifications.getPermissionsAsync();
      return mapStatus(current.status);
    } catch {
      return 'restricted';
    }
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      await configureHandler();
      const Notifications = await loadNotifications();
      const current = await Notifications.getPermissionsAsync();
      if (current.status === 'granted') {
        await ensureAndroidChannel();
        return 'granted';
      }
      if (current.status === 'denied' && current.canAskAgain === false) return 'denied';
      const next = await Notifications.requestPermissionsAsync();
      const status = mapStatus(next.status);
      if (status === 'granted') await ensureAndroidChannel();
      return status;
    } catch {
      return 'restricted';
    }
  }

  async isAvailable(): Promise<boolean> {
    return (await this.getPermissionStatus()) === 'granted';
  }

  async notifyNow(input: { id: string; title: string; body: string; href: string }): Promise<void> {
    if (Platform.OS === 'web' || !(await this.isAvailable())) throw new Error('Notifications are unavailable');
    try {
      await configureHandler();
      await ensureAndroidChannel();
      const Notifications = await loadNotifications();
      await Notifications.scheduleNotificationAsync({
        identifier: input.id,
        content: {
          title: input.title,
          body: input.body,
          data: { href: input.href },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      throw error;
    }
  }

  async schedule(input: ScheduledReminder): Promise<void> {
    if (Platform.OS === 'web' || !(await this.isAvailable())) throw new Error('Notifications are unavailable');
    if (Number.isNaN(input.at.getTime())) return;
    if (input.at.getTime() <= Date.now()) {
      await this.notifyNow(input);
      return;
    }
    try {
      await configureHandler();
      await ensureAndroidChannel();
      const Notifications = await loadNotifications();
      await Notifications.cancelScheduledNotificationAsync(input.id).catch(() => undefined);
      await Notifications.scheduleNotificationAsync({
        identifier: input.id,
        content: {
          title: input.title,
          body: input.body,
          data: { href: input.href },
          sound: 'default',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: input.at },
      });
    } catch (error) {
      throw error;
    }
  }

  async cancel(id: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const Notifications = await loadNotifications();
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already gone is fine.
    }
  }

  async listScheduledIds(): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    try {
      const Notifications = await loadNotifications();
      const items = await Notifications.getAllScheduledNotificationsAsync();
      return items.map((item) => item.identifier).filter(Boolean);
    } catch {
      return [];
    }
  }
}

export const appNotificationService: AppNotificationService = new ExpoNotificationService();

void configureHandler();
