import { useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { syncPushRegistration } from '@/lib/notifications/push-token';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';

/**
 * Registers Expo push tokens when notifications are enabled.
 * Local due-date alerts still work without a token; remote push needs EAS + projectId.
 */
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const { preferences, isLoading } = usePreferences();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status !== 'signed-in' || isLoading) return;

    const enabled = preferences.notifications.pushEnabled;

    let cancelled = false;
    const register = async () => {
      if (cancelled) return;
      await syncPushRegistration({
        enabled,
        requestPermission: false,
      });
    };
    void register().catch(() => undefined);
    const interval = setInterval(() => void register().catch(() => undefined), 60_000);
    const network = NetInfo.addEventListener((state) => {
      if (state.isConnected) void register().catch(() => undefined);
    });
    let tokenListener: { remove(): void } | undefined;
    void import('expo-notifications').then((Notifications) => {
      if (!cancelled) tokenListener = Notifications.addPushTokenListener(() => { void register().catch(() => undefined); });
    }).catch(() => undefined);
    return () => { cancelled = true; clearInterval(interval); network(); tokenListener?.remove(); };
  }, [preferences.notifications.pushEnabled, status, user?.id, isLoading]);

  return children;
}
