import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { preferencesStorage } from '@/lib/storage/preferences-storage';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { obtainExpoPushToken } from '@/lib/notifications/push-token';
import { pushTokenRepository } from '@/lib/api/push-token-repository';
import { useAuth } from './AuthProvider';
import { Platform } from 'react-native';

type DeliveryMode = 'local' | 'remote';
const Context = createContext<{ mode: DeliveryMode; ready: boolean; changeMode: (mode: DeliveryMode) => Promise<void> }>({ mode: 'local', ready: false, changeMode: async () => {} });
export const useNotificationDelivery = () => useContext(Context);
export function NotificationDeliveryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<DeliveryMode>('local');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void preferencesStorage.getItem(`blugo.deliveryMode.${user?.id ?? 'signed-out'}`).then((raw) => {
      if (!cancelled) { setMode(raw === 'remote' ? 'remote' : 'local'); setReady(true); }
    }).catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, [user?.id]);
  const changeMode = useCallback(async (next: DeliveryMode) => {
    if (!user || Platform.OS === 'web') throw new Error('Delivery mode needs a native account');
    const token = await obtainExpoPushToken();
    if (!token) throw new Error('Remote push registration is unavailable');
    // Local and remote due delivery are mutually exclusive per installation.
    // Change on the server first. An offline switch retains the existing mode.
    await pushTokenRepository.upsertToken(token, Platform.OS === 'ios' ? 'ios' : 'android', user.id, next);
    if (next === 'remote') {
      const ids = await appNotificationService.listScheduledIds();
      await Promise.all(ids.filter((id) => id.startsWith('due:')).map((id) => appNotificationService.cancel(id)));
    }
    await preferencesStorage.setItem(`blugo.deliveryMode.${user.id}`, next);
    setMode(next);
  }, [user]);
  return <Context.Provider value={{ mode, ready, changeMode }}>{children}</Context.Provider>;
}
