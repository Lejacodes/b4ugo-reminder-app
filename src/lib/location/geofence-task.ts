import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { formatPlaceNotificationCopy } from '@/lib/location/place-anchors';
import { loadGeofenceManifest } from '@/lib/location/geofence-manifest';

export const GEOFENCE_TASK_NAME = 'blugo-geofence';

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[blugo] geofence task error', error.message);
    return;
  }
  if (!data || typeof data !== 'object') return;

  const payload = data as { eventType?: number; region?: { identifier?: string } };
  if (payload.eventType !== GeofencingEventType.Enter) return;

  const regionId = payload.region?.identifier;
  if (!regionId) return;

  const manifest = await loadGeofenceManifest();
  const region = manifest.regions[regionId];
  if (!region || region.items.length === 0) return;

  const copy = formatPlaceNotificationCopy({
    id: regionId,
    placeName: region.placeName,
    latitude: 0,
    longitude: 0,
    radiusMeters: 0,
    items: region.items.map((item) => ({
      reminderId: item.reminderId,
      title: item.title,
      href: item.href,
    })),
  });

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      identifier: `geo:${regionId}:${Date.now()}`,
      content: {
        title: copy.title,
        body: copy.body,
        data: { href: copy.href },
        sound: 'default',
      },
      trigger: null,
    });
  } catch (taskError) {
    console.warn('[blugo] geofence notify failed', taskError);
  }
});
