import { useCallback, useEffect, useRef, useState } from 'react';

import type { DeviceLocation } from '@/lib/engines/contracts';
import {
  deviceLocationService,
  type LocationPermissionStatus,
} from '@/lib/location/device-location';

type UseDeviceLocationOptions = {
  /** Start a live GPS watch (for maps). Default true. */
  watch?: boolean;
  /** Use high-accuracy fixes for map centering. Default true. */
  highAccuracy?: boolean;
  /** Request permission and start on mount. Default true. */
  autoStart?: boolean;
};

type UseDeviceLocationResult = {
  location: DeviceLocation | null;
  permission: LocationPermissionStatus;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<LocationPermissionStatus>;
  refresh: () => Promise<DeviceLocation | null>;
};

export function useDeviceLocation(options: UseDeviceLocationOptions = {}): UseDeviceLocationResult {
  const watch = options.watch ?? true;
  const highAccuracy = options.highAccuracy ?? true;
  const autoStart = options.autoStart ?? true;

  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [loading, setLoading] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);
  const stopWatch = useRef<(() => void) | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopWatch.current?.();
      stopWatch.current = null;
    };
  }, []);

  const startWatch = useCallback(async () => {
    stopWatch.current?.();
    stopWatch.current = null;
    if (!watch) return;
    const stop = await deviceLocationService.watchPosition(
      (next) => {
        if (mounted.current) setLocation(next);
      },
      { highAccuracy },
    );
    stopWatch.current = stop;
  }, [highAccuracy, watch]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fix = await deviceLocationService.getCurrentPosition({ highAccuracy });
      if (mounted.current) setLocation(fix);
      return fix;
    } catch {
      if (mounted.current) setError('could not read your location.');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [highAccuracy]);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await deviceLocationService.requestPermission();
      if (!mounted.current) return next;
      setPermission(next);
      if (next !== 'granted') {
        setError(
          next === 'denied'
            ? 'location access is off. enable it in Settings to see where you are.'
            : 'location is not available here.',
        );
        return next;
      }
      await refresh();
      await startWatch();
      return next;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [refresh, startWatch]);

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;

    async function boot() {
      const status = await deviceLocationService.getPermissionStatus();
      if (cancelled || !mounted.current) return;
      setPermission(status);
      if (status === 'granted') {
        await refresh();
        await startWatch();
        return;
      }
      setLoading(false);
      setError('location access is off. enable it in Settings to see where you are.');
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [autoStart, refresh, requestPermission, startWatch]);

  return {
    location,
    permission,
    loading,
    error,
    requestPermission,
    refresh,
  };
}
