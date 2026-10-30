import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { pushTokenRepository } from '@/lib/api/push-token-repository';

import { appNotificationService } from './notification-service';
import { invalidatePushRegistration, pushGeneration } from './installation';
import { requireSessionUserId } from '@/lib/supabase/client';

export function resolveEasProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromExtra = extra?.eas?.projectId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  const fromEas = Constants.easConfig?.projectId;
  if (typeof fromEas === 'string' && fromEas.length > 0) return fromEas;
  return null;
}

export async function obtainExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  const projectId = resolveEasProjectId();
  if (!projectId) {
    console.warn('[blugo] push token skipped — set EXPO_PUBLIC_EAS_PROJECT_ID for remote push');
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data ?? null;
  } catch {
    console.warn('[blugo] push token unavailable; retry after reconnecting');
    return null;
  }
}

export async function syncPushRegistration(input: {
  enabled: boolean;
  requestPermission?: boolean;
}): Promise<'granted' | 'denied' | 'restricted' | 'skipped' | 'undetermined'> {
  if (Platform.OS === 'web') return 'skipped';

  if (!input.enabled) {
    invalidatePushRegistration();
    await pushTokenRepository.removeCurrentInstallation();
    return 'skipped';
  }

  const generation = pushGeneration();
  const userId = await requireSessionUserId();
  let status = await appNotificationService.getPermissionStatus();
  if (status !== 'granted' && input.requestPermission) {
    status = await appNotificationService.requestPermission();
  }
  if (status !== 'granted') return status;

  const token = await obtainExpoPushToken();
  if (!token) return 'skipped';

  if (generation !== pushGeneration() || await requireSessionUserId() !== userId) return 'skipped';
  await pushTokenRepository.upsertToken(token, Platform.OS === 'ios' ? 'ios' : 'android', userId);
  if (generation !== pushGeneration()) await pushTokenRepository.removeCurrentInstallation(userId);
  return 'granted';
}
