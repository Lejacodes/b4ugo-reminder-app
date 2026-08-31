import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { syncPushRegistration } from '@/lib/notifications/push-token';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';

/**
 * Registers Expo push tokens when notifications are enabled.
 * Local due-date alerts still work without a token; remote push needs EAS + projectId.
 */
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { preferences } = usePreferences();
  const lastEnabled = useRef<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status !== 'signed-in') return;

    const enabled = preferences.notifications.pushEnabled;
    const becameEnabled = lastEnabled.current === false && enabled;
    lastEnabled.current = enabled;

    void (async () => {
      const permission = await appNotificationService.getPermissionStatus();
      await syncPushRegistration({
        enabled,
        requestPermission: becameEnabled || permission === 'undetermined',
      });
    })();
  }, [preferences.notifications.pushEnabled, status]);

  return children;
}
