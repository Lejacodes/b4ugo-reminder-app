import { Platform } from 'react-native';

import { clearGeofenceManifest, saveGeofenceManifest } from '@/lib/location/geofence-manifest';
import { GEOFENCE_TASK_NAME } from '@/lib/location/geofence-task';
import type { PlaceAnchor } from '@/lib/location/place-anchors';
import { deviceLocationService } from '@/lib/location/device-location';
import { appNotificationService } from '@/lib/notifications/notification-service';

let generation = 0;
let pending: Promise<void> = Promise.resolve();
export function syncGeofenceRegions(input: {
  anchors: PlaceAnchor[];
  enabled: boolean;
}): Promise<void> {
  const epoch = ++generation;
  const run = pending.catch(() => {}).then(() => synchronizeRegions(input, epoch));
  pending = run;
  return run;
}

async function synchronizeRegions(input: { anchors: PlaceAnchor[]; enabled: boolean }, epoch: number): Promise<void> {
  if (Platform.OS === 'web') return;
  if (epoch !== generation) return;

  if (!input.enabled || input.anchors.length === 0) {
    await clearRegistrations();
    return;
  }

  const backgroundReady = await deviceLocationService.hasBackgroundPermission();
  if (epoch !== generation) return;
  if (!backgroundReady) {
    await clearRegistrations();
    return;
  }

  try {
    const Location = await import('expo-location');
    if (epoch !== generation) return;
    const anchors = input.anchors.slice(0, Platform.OS === 'ios' ? 20 : 100);
    await saveGeofenceManifest(anchors);

    const regions = anchors.map((anchor) => ({
      identifier: anchor.id,
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      radius: anchor.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
    if (epoch !== generation) return;
    if (started) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
    if (epoch !== generation) return;
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
  } catch (error) {
    await clearGeofenceManifest();
    throw error;
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
  generation += 1;
  await clearGeofenceManifest();
  const run = pending.catch(() => {}).then(clearRegistrations);
  pending = run;
  return run;
}

async function clearRegistrations(): Promise<void> {
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
