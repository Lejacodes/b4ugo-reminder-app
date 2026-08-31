import { Platform } from 'react-native';

import type { DeviceLocation } from '@/lib/engines/contracts';
import { isValidCoordinates } from '@/lib/location/coordinates';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

export type DeviceLocationService = {
  getPermissionStatus(): Promise<LocationPermissionStatus>;
  requestPermission(): Promise<LocationPermissionStatus>;
  getBackgroundPermissionStatus(): Promise<LocationPermissionStatus>;
  requestBackgroundPermission(): Promise<LocationPermissionStatus>;
  hasBackgroundPermission(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  getCurrentPosition(options?: { highAccuracy?: boolean }): Promise<DeviceLocation | null>;
  watchPosition(
    onChange: (location: DeviceLocation) => void,
    options?: { highAccuracy?: boolean },
  ): Promise<() => void>;
};

function mapPermission(status: string | undefined): LocationPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  if (status === 'restricted') return 'restricted';
  return 'undetermined';
}

async function loadLocation() {
  return import('expo-location');
}

export class ExpoLocationService implements DeviceLocationService {
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      const Location = await loadLocation();
      const current = await Location.getForegroundPermissionsAsync();
      return mapPermission(current.status);
    } catch {
      return 'restricted';
    }
  }

  async requestPermission(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      const Location = await loadLocation();
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') return 'granted';
      if (current.status === 'denied' && !current.canAskAgain) return 'denied';
      const next = await Location.requestForegroundPermissionsAsync();
      return mapPermission(next.status);
    } catch {
      return 'restricted';
    }
  }

  async getBackgroundPermissionStatus(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      const Location = await loadLocation();
      const current = await Location.getBackgroundPermissionsAsync();
      return mapPermission(current.status);
    } catch {
      return 'restricted';
    }
  }

  async requestBackgroundPermission(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'web') return 'restricted';
    try {
      const foreground = await this.requestPermission();
      if (foreground !== 'granted') return foreground;
      const Location = await loadLocation();
      const current = await Location.getBackgroundPermissionsAsync();
      if (current.status === 'granted') return 'granted';
      if (current.status === 'denied' && !current.canAskAgain) return 'denied';
      const next = await Location.requestBackgroundPermissionsAsync();
      return mapPermission(next.status);
    } catch {
      return 'restricted';
    }
  }

  async hasBackgroundPermission(): Promise<boolean> {
    return (await this.getBackgroundPermissionStatus()) === 'granted';
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const Location = await loadLocation();
      const enabled = await Location.hasServicesEnabledAsync();
      const permission = await this.getPermissionStatus();
      return enabled && permission === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentPosition(options?: { highAccuracy?: boolean }): Promise<DeviceLocation | null> {
    if (Platform.OS === 'web') return null;
    try {
      if (!(await this.isAvailable())) return null;
      const Location = await loadLocation();
      const fix = await Location.getCurrentPositionAsync({
        accuracy: options?.highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      const next = {
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        recordedAt: new Date(fix.timestamp).toISOString(),
      };
      return isValidCoordinates(next) ? next : null;
    } catch (error) {
      console.warn('[blugo] location read failed', error);
      return null;
    }
  }

  async watchPosition(
    onChange: (location: DeviceLocation) => void,
    options?: { highAccuracy?: boolean },
  ): Promise<() => void> {
    if (Platform.OS === 'web') return () => {};
    if (!(await this.isAvailable())) return () => {};
    try {
      const Location = await loadLocation();
      const subscription = await Location.watchPositionAsync(
        options?.highAccuracy
          ? {
              accuracy: Location.Accuracy.High,
              distanceInterval: 8,
              timeInterval: 3_000,
            }
          : {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 40,
              timeInterval: 15_000,
            },
        (fix) => {
          const next = {
            latitude: fix.coords.latitude,
            longitude: fix.coords.longitude,
            recordedAt: new Date(fix.timestamp).toISOString(),
          };
          if (!isValidCoordinates(next)) return;
          onChange(next);
        },
      );
      return () => subscription.remove();
    } catch (error) {
      console.warn('[blugo] location watch failed', error);
      return () => {};
    }
  }
}

export const deviceLocationService: DeviceLocationService = new ExpoLocationService();
