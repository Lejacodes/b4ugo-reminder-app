/**
 * Location / places / geofence / notifications — contracts only for now.
 *
 * None of these talk to GPS, Maps, or a push service. They exist so the rest
 * of the app can depend on an interface instead of a pretend implementation.
 */
import { resolvePlace } from '@/lib/geocoding/open-meteo';
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
    return false;
  }

  async getCurrentPosition(): Promise<DeviceLocation | null> {
    return null;
  }
}

export class LocalPlaceService implements PlaceService {
  async resolve(placeName: string): Promise<PlaceLookup> {
    return resolvePlace(placeName);
  }
}

export class LocalGeofenceService implements GeofenceService {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async watch(_reminders: Reminder[]): Promise<void> {
    // Background geofencing is not implemented.
  }
}

export class LocalNotificationService implements NotificationService {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async notifyNearby(_reminder: Reminder, _location: ReminderLocation): Promise<void> {
    // Local/push notifications are not implemented.
  }
}

export const locationService = new LocalLocationService();
export const placeService = new LocalPlaceService();
export const geofenceService = new LocalGeofenceService();
export const notificationService = new LocalNotificationService();
