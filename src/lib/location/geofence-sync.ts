import { Platform } from 'react-native';

import { clearGeofenceManifest, saveGeofenceManifest } from '@/lib/location/geofence-manifest';
import { GEOFENCE_TASK_NAME } from '@/lib/location/geofence-task';
import type { PlaceAnchor } from '@/lib/location/place-anchors';
import { deviceLocationService } from '@/lib/location/device-location';
import { appNotificationService } from '@/lib/notifications/notification-service';

export async function syncGeofenceRegions(input: {
  anchors: PlaceAnchor[];
  enabled: boolean;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  if (!input.enabled || input.anchors.length === 0) {
    await clearGeofenceRegistrations();
    return;
  }

  const backgroundReady = await deviceLocationService.hasBackgroundPermission();
  if (!backgroundReady) {
    await saveGeofenceManifest(input.anchors);
    return;
  }

  try {
    const Location = await import('expo-location');
    const TaskManager = await import('expo-task-manager');

    const registered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (!registered) {
      console.warn('[blugo] geofence task not registered');
      await saveGeofenceManifest(input.anchors);
      return;
    }

    await saveGeofenceManifest(input.anchors);

    const regions = input.anchors.map((anchor) => ({
      identifier: anchor.id,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      radius: anchor.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
    if (started) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
  } catch (error) {
    console.warn('[blugo] geofence sync failed', error);
    await saveGeofenceManifest(input.anchors);
  }
}

async function stopGeofencing(): Promise<void> {
  const Location = await import('expo-location');
  const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
  if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
}

/**
 * Removes every device-side artifact that could notify for the previous user.
 * The manifest is cleared first so even a racing background task has no copy
 * to display while native region monitoring is being stopped.
 */
export async function clearGeofenceRegistrations(): Promise<void> {
  const failures: unknown[] = [];
  try {
    await clearGeofenceManifest();
  } catch (error) {
    failures.push(error);
  }

  if (Platform.OS !== 'web') {
    try {
      await stopGeofencing();
    } catch (error) {
      failures.push(error);
    }

    try {
      const ids = await appNotificationService.listScheduledIds();
      await Promise.all(ids.filter((id) => id.startsWith('geo:')).map((id) => appNotificationService.cancel(id)));
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, 'geofence cleanup failed');
  }
}
