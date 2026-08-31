/**
 * Location / places / geofence / notifications.
 */
import { resolvePlace } from '@/lib/geocoding';
import { syncGeofenceRegions } from '@/lib/location/geofence-sync';
import { buildPlaceAnchors, formatPlaceNotificationCopy } from '@/lib/location/place-anchors';
import { deviceLocationService } from '@/lib/location/device-location';
import { appNotificationService } from '@/lib/notifications/notification-service';
import type { Reminder, ReminderLocation } from '@/types/reminder';

import type {
  DeviceLocation,
  GeofenceService,
  LocationService,
  NotificationService,
  PlaceLookup,
  PlaceService,
} from './contracts';

export class LocalLocationService implements LocationService {
  async isAvailable(): Promise<boolean> {
    return deviceLocationService.isAvailable();
  }

  async getCurrentPosition(): Promise<DeviceLocation | null> {
    return deviceLocationService.getCurrentPosition();
  }
}

export class LocalPlaceService implements PlaceService {
  async resolve(placeName: string): Promise<PlaceLookup> {
    const here = await deviceLocationService.getCurrentPosition({ highAccuracy: true });
    return resolvePlace(placeName, here ? { near: here } : undefined);
  }
}

export class ExpoGeofenceService implements GeofenceService {
  async isAvailable(): Promise<boolean> {
    return deviceLocationService.hasBackgroundPermission();
  }

  async watch(reminders: Reminder[]): Promise<void> {
    const anchors = buildPlaceAnchors(reminders);
    await syncGeofenceRegions({ anchors, enabled: anchors.length > 0 });
  }
}

export class LocalGeofenceService implements GeofenceService {
  private delegate = new ExpoGeofenceService();

  async isAvailable(): Promise<boolean> {
    return this.delegate.isAvailable();
  }

  async watch(reminders: Reminder[]): Promise<void> {
    await this.delegate.watch(reminders);
  }
}

export class LocalNotificationService implements NotificationService {
  async isAvailable(): Promise<boolean> {
    return appNotificationService.isAvailable();
  }

  async notifyNearby(reminder: Reminder, location: ReminderLocation): Promise<void> {
    const copy = formatPlaceNotificationCopy({
      id: reminder.id,
      placeName: location.placeName,
      latitude: location.latitude ?? 0,
      longitude: location.longitude ?? 0,
      radiusMeters: 0,
      items: [
        {
          reminderId: reminder.id,
          title: reminder.title,
          href: reminder.category === 'onTheWayBack' ? '/on-the-way-back' : '/reminders',
        },
      ],
    });
    await appNotificationService.notifyNow({
      id: reminder.id,
      title: copy.title,
      body: copy.body,
      href: copy.href,
    });
  }
}

export const locationService = new LocalLocationService();
export const placeService = new LocalPlaceService();
export const geofenceService = new LocalGeofenceService();
export const notificationService = new LocalNotificationService();
