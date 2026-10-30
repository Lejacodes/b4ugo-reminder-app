import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';

import { evaluateReminders } from '@/lib/context/evaluate-reminders';
import type { DeviceLocation } from '@/lib/engines/contracts';
import { syncGeofenceRegions } from '@/lib/location/geofence-sync';
import { isValidCoordinates } from '@/lib/location/coordinates';
import {
  buildPlaceAnchors,
  formatPlaceNotificationCopy,
  SHOP_GEOFENCE_RADIUS_M,
  type PlaceAnchor,
} from '@/lib/location/place-anchors';
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
  shouldNotify,
  type NotificationRecord,
} from '@/lib/notifications/dedupe';
import { planDueReminderActions } from '@/lib/notifications/due-reminders';
import { watchWifiDepartureTrigger } from '@/lib/notifications/departure-trigger';
import { appNotificationService, copyForReminder } from '@/lib/notifications/notification-service';
import { hrefFromNotificationData, isDueNotificationId } from '@/lib/notifications/routing';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { useAuth } from '@/store/AuthProvider';
import { usePlaces } from '@/store/PlaceProvider';
import { usePreferences } from '@/store/PreferencesProvider';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';
import type { AppContext } from '@/types/context';
import { useNotificationDelivery } from '@/store/NotificationDeliveryProvider';

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

function anchorsToProximityPlaces(anchors: PlaceAnchor[]): ProximityPlace[] {
  return anchors.map((anchor) => ({
    id: anchor.id,
    name: anchor.placeName,
    latitude: anchor.latitude,
    longitude: anchor.longitude,
  }));
}

/**
 * Location intelligence: foreground proximity + OS geofences for shops/markets.
 */
export function ContextIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const delivery = useNotificationDelivery();
  const { preferences } = usePreferences();
  const { reminders, personalNecessities, context, onTheWayBackItems } = useReminders();
  const { packingItems, upcomingTrips, activeTrip } = useTrips();
  const { places, home } = usePlaces();
  const logRef = useRef<NotificationRecord[]>([]);
  const watchStop = useRef<(() => void) | null>(null);
  const handledResponse = useRef<string | null>(null);
  const anchorIndex = useRef<Map<string, PlaceAnchor>>(new Map());
  const dueQueue = useRef<Promise<void>>(Promise.resolve());

  const shopAnchors = useMemo(
    () => buildPlaceAnchors(reminders, places),
    [places, reminders],
  );

  useEffect(() => {
    anchorIndex.current = new Map(shopAnchors.map((anchor) => [anchor.id, anchor]));
  }, [shopAnchors]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      logRef.current = [];
      return;
    }
    loadLog(userId).then((records) => {
      if (!cancelled) logRef.current = records;
    }).catch(() => undefined);
    return () => { cancelled = true; };
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
    if (!delivery.ready) return;

    let cancelled = false;
    const run = dueQueue.current.catch(() => {}).then(async () => {
      if (cancelled) return;
      try {
        const scheduledIds = await appNotificationService.listScheduledIds();
        if (cancelled) return;
        if (!preferences.notifications.pushEnabled || delivery.mode === 'remote') {
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
          if (cancelled) await appNotificationService.cancel(action.id);
        }
      } catch (error) {
        console.warn('[blugo] due reminder sync failed', error);
      }
    });
    dueQueue.current = run;

    return () => {
      cancelled = true;
    };
  }, [preferences.notifications.pushEnabled, reminders, status, userId, delivery.ready, delivery.mode]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (status !== 'signed-in') return;

    const enabled =
      preferences.notifications.pushEnabled && preferences.reminders.locationRemindersEnabled;

    void syncGeofenceRegions({ anchors: shopAnchors, enabled }).catch(() => {
      console.warn('[blugo] geofencing unavailable; check diagnostics');
    });
  }, [
    preferences.notifications.pushEnabled,
    preferences.reminders.locationRemindersEnabled,
    shopAnchors,
    status,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      watchStop.current?.();
      watchStop.current = null;
      if (
        !shouldWatchLocation({
          signedIn: status === 'signed-in' && Boolean(userId),
          locationRemindersEnabled: preferences.reminders.locationRemindersEnabled,
          platform: Platform.OS,
        })
      ) {
        return;
      }

      const available = await deviceLocationService.isAvailable();
      if (!available || cancelled) return;

      const stop = await deviceLocationService.watchPosition((location) => {
        void handleLocation(location);
      }, { highAccuracy: true });
      if (cancelled) {
        stop();
        return;
      }
      watchStop.current = stop;
    }

    async function notifyShopAnchor(anchor: PlaceAnchor) {
      if (cancelled || !userId || !preferences.notifications.pushEnabled) return;
      if (!(await appNotificationService.isAvailable())) return;
      if (cancelled) return;

      const contextKey = contextNotificationKey({
        kind: 'specificPlace',
        placeName: anchor.placeName,
      });
      const copy = formatPlaceNotificationCopy(anchor);
      const notifyId = `shop:${anchor.id}`;

      if (!shouldNotify(logRef.current, notificationKey(notifyId, contextKey))) return;

      await appNotificationService.notifyNow({
        id: `${notifyId}-${contextKey}`,
        title: copy.title,
        body: copy.body,
        href: copy.href,
      });
      if (cancelled) return;
      logRef.current = rememberNotification(logRef.current, notificationKey(notifyId, contextKey));
      await saveLog(userId, logRef.current);
    }

    async function notifyContext(appContext: AppContext, label?: string) {
      if (cancelled || !userId || !preferences.notifications.pushEnabled) return;
      if (!(await appNotificationService.isAvailable())) return;
      if (cancelled) return;
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
        if (cancelled) return;
        const key = notificationKey(item.id, contextKey);
        const copy = copyForReminder(item, label);
        await appNotificationService.notifyNow({
          id: `${item.id}-${contextKey}`,
          title: copy.title,
          body: copy.body,
          href: item.href,
        });
        if (cancelled) return;
        logRef.current = rememberNotification(logRef.current, key);
      }
      if (pending.length > 0) await saveLog(userId, logRef.current);
    }

    async function handleLocation(location: DeviceLocation) {
      if (cancelled) return;
      if (!isValidCoordinates(location)) return;

      const tripPlaces: ProximityPlace[] = upcomingTrips
        .filter((trip) => isValidCoordinates({ latitude: trip.latitude, longitude: trip.longitude }))
        .map((trip) => ({
          id: `trip:${trip.id}`,
          name: trip.destination,
          latitude: trip.latitude ?? null,
          longitude: trip.longitude ?? null,
        }));

      const shopPlaces = anchorsToProximityPlaces(shopAnchors);

      let events;
      try {
        events = proximityTracker.evaluate({
          current: location,
          home: home && isValidCoordinates(home)
            ? { id: home.id, name: home.name, latitude: home.latitude, longitude: home.longitude }
            : null,
          places: [...shopPlaces, ...tripPlaces],
          placeRadius: SHOP_GEOFENCE_RADIUS_M,
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
          const anchor = anchorIndex.current.get(event.place.id);
          if (anchor) {
            await notifyShopAnchor(anchor);
            continue;
          }
          if (event.place.id.startsWith('trip:')) {
            const tripId = event.place.id.slice('trip:'.length);
            await notifyContext({ kind: 'trip', tripId }, event.place.name);
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
    shopAnchors,
    status,
    upcomingTrips,
    userId,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web' || status !== 'signed-in' || !userId) return;
    return watchWifiDepartureTrigger({
      userId,
      pushEnabled: preferences.notifications.pushEnabled,
    });
  }, [preferences.notifications.pushEnabled, status, userId]);

  return children;
}
