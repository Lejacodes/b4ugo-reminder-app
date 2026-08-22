import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { evaluateReminders } from '@/lib/context/evaluate-reminders';
import type { DeviceLocation } from '@/lib/engines/contracts';
import { isValidCoordinates } from '@/lib/location/coordinates';
import { deviceLocationService } from '@/lib/location/device-location';
import { proximityTracker, type ProximityPlace } from '@/lib/location/proximity';
import {
  contextNotificationKey,
  remindersToNotify,
  shouldWatchLocation,
} from '@/lib/notifications/context-notify';
import {
  forgetKeys,
  notificationKey,
  rememberNotification,
  type NotificationRecord,
} from '@/lib/notifications/dedupe';
import { planDueReminderActions } from '@/lib/notifications/due-reminders';
import { appNotificationService, copyForReminder } from '@/lib/notifications/notification-service';
import { hrefFromNotificationData, isDueNotificationId } from '@/lib/notifications/routing';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { useAuth } from '@/store/AuthProvider';
import { usePlaces } from '@/store/PlaceProvider';
import { usePreferences } from '@/store/PreferencesProvider';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';
import type { AppContext } from '@/types/context';

async function loadLog(userId: string): Promise<NotificationRecord[]> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.notificationLog, userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as NotificationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLog(userId: string, records: NotificationRecord[]): Promise<void> {
  await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.notificationLog, userId), JSON.stringify(records));
}

function openNotificationHref(
  router: { push: (href: never) => void },
  data: unknown,
): void {
  const href = hrefFromNotificationData(data);
  if (!href) return;
  try {
    router.push(href as never);
  } catch (error) {
    console.warn('[blugo] notification route failed', error);
  }
}

/**
 * Foreground location → context engine → local notifications.
 * This is not OS background geofencing and does nothing on web.
 */
export function ContextIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const { preferences } = usePreferences();
  const { reminders, personalNecessities, context, onTheWayBackItems } = useReminders();
  const { packingItems, upcomingTrips, activeTrip } = useTrips();
  const { places, home } = usePlaces();
  const logRef = useRef<NotificationRecord[]>([]);
  const watchStop = useRef<(() => void) | null>(null);
  const handledResponse = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      logRef.current = [];
      return;
    }
    loadLog(userId).then((records) => {
      logRef.current = records;
    });
  }, [userId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    let sub: { remove: () => void } | undefined;

    void import('expo-notifications')
      .then((Notifications) => {
        if (cancelled) return;

        const consume = (response: {
          notification: { request: { identifier?: string; content?: { data?: unknown } } };
        }) => {
          const id = response.notification.request.identifier;
          if (!id || handledResponse.current === id) return;
          handledResponse.current = id;
          openNotificationHref(router, response.notification.request.content?.data);
        };

        try {
          const last =
            typeof Notifications.getLastNotificationResponse === 'function'
              ? Notifications.getLastNotificationResponse()
              : null;
          if (last) consume(last);
        } catch {
          // Cold-start payload can be missing or stale.
        }

        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          consume(response);
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status !== 'signed-in' || !userId) return;

    let cancelled = false;
    void (async () => {
      try {
        const scheduledIds = await appNotificationService.listScheduledIds();
        if (cancelled) return;
        if (!preferences.notifications.pushEnabled) {
          for (const id of scheduledIds) {
            if (isDueNotificationId(id)) await appNotificationService.cancel(id);
          }
          return;
        }
        const actions = planDueReminderActions(reminders, scheduledIds);
        for (const action of actions) {
          if (cancelled) return;
          if (action.type === 'cancel') {
            await appNotificationService.cancel(action.id);
            continue;
          }
          await appNotificationService.schedule({
            id: action.id,
            title: action.title,
            body: action.body,
            href: action.href,
            at: action.at,
          });
        }
      } catch (error) {
        console.warn('[blugo] due reminder sync failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preferences.notifications.pushEnabled, reminders, status, userId]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      watchStop.current?.();
      watchStop.current = null;
      if (
        !shouldWatchLocation({
          signedIn: status === 'signed-in' && Boolean(userId),
          locationRemindersEnabled: preferences.reminders.locationRemindersEnabled,
          preferContextual: preferences.reminders.preferContextual,
          platform: Platform.OS,
        })
      ) {
        return;
      }

      const available = await deviceLocationService.isAvailable();
      if (!available || cancelled) return;

      const stop = await deviceLocationService.watchPosition((location) => {
        void handleLocation(location);
      });
      if (cancelled) {
        stop();
        return;
      }
      watchStop.current = stop;
    }

    async function notifyContext(appContext: AppContext, label?: string) {
      if (!userId || !preferences.notifications.pushEnabled) return;
      if (!(await appNotificationService.isAvailable())) return;
      const ranked = evaluateReminders({
        context: appContext,
        reminders,
        personalNecessities,
        packingItems,
        routinesEnabled: preferences.reminders.routineRemindersEnabled,
        preferContextual: preferences.reminders.preferContextual,
      });
      const contextKey = contextNotificationKey(appContext);
      const pending = remindersToNotify(ranked, logRef.current, contextKey);
      for (const item of pending) {
        const key = notificationKey(item.id, contextKey);
        const copy = copyForReminder(item, label);
        await appNotificationService.notifyNow({
          id: `${item.id}-${contextKey}`,
          title: copy.title,
          body: copy.body,
          href: item.href,
        });
        logRef.current = rememberNotification(logRef.current, key);
      }
      if (pending.length > 0) await saveLog(userId, logRef.current);
    }

    async function handleLocation(location: DeviceLocation) {
      if (!isValidCoordinates(location)) return;
      const tripPlaces: ProximityPlace[] = upcomingTrips
        .filter((trip) => isValidCoordinates({ latitude: trip.latitude, longitude: trip.longitude }))
        .map((trip) => ({
          id: `trip:${trip.id}`,
          name: trip.destination,
          latitude: trip.latitude ?? null,
          longitude: trip.longitude ?? null,
        }));
      const saved: ProximityPlace[] = places
        .filter((place) => place.type !== 'home' && place.isActive)
        .filter((place) => isValidCoordinates(place))
        .map((place) => ({
          id: place.id,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
        }));
      const wayBack: ProximityPlace[] = onTheWayBackItems
        .filter((item) => isValidCoordinates(item.location))
        .map((item) => ({
          id: `rem:${item.id}`,
          name: item.location?.placeName ?? item.title,
          latitude: item.location?.latitude ?? null,
          longitude: item.location?.longitude ?? null,
        }));

      let events;
      try {
        events = proximityTracker.evaluate({
          current: location,
          home: home && isValidCoordinates(home)
            ? { id: home.id, name: home.name, latitude: home.latitude, longitude: home.longitude }
            : null,
          places: [...saved, ...wayBack, ...tripPlaces],
        });
      } catch (error) {
        console.warn('[blugo] proximity failed', error);
        return;
      }

      for (const event of events) {
        if (event.type === 'leftHome') {
          await notifyContext({ kind: 'leavingHome', departureId: context?.id ?? null }, 'home');
        }
        if (event.type === 'enteredPlace') {
          if (event.place.id.startsWith('trip:')) {
            const tripId = event.place.id.slice('trip:'.length);
            await notifyContext({ kind: 'trip', tripId }, event.place.name);
          } else if (event.place.id.startsWith('rem:')) {
            await notifyContext(
              { kind: 'onTheWayBack', placeName: event.place.name },
              event.place.name,
            );
          } else {
            await notifyContext(
              { kind: 'specificPlace', placeId: event.place.id, placeName: event.place.name },
              event.place.name,
            );
          }
        }
        if (event.type === 'leftPlace') {
          const prefix = notificationKey('', event.place.name);
          logRef.current = forgetKeys(
            logRef.current,
            logRef.current
              .filter((item) => item.key.includes(event.place.id) || item.key.includes(prefix))
              .map((item) => item.key),
          );
          if (userId) await saveLog(userId, logRef.current);
        }
      }
    }

    start().catch((error) => {
      console.warn('[blugo] location watch failed', error);
    });
    return () => {
      cancelled = true;
      watchStop.current?.();
      watchStop.current = null;
    };
  }, [
    activeTrip,
    context?.id,
    home,
    onTheWayBackItems,
    packingItems,
    personalNecessities,
    places,
    preferences.notifications.pushEnabled,
    preferences.reminders.locationRemindersEnabled,
    preferences.reminders.preferContextual,
    preferences.reminders.routineRemindersEnabled,
    reminders,
    status,
    upcomingTrips,
    userId,
  ]);

  return children;
}
