import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';

import { readableType, readableFont } from '@/constants/scrapbook';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import type { DeviceLocation } from '@/lib/engines/contracts';
import { reverseGeocodeLocation } from '@/lib/geocoding/reverse-geocode';
import { isValidCoordinates } from '@/lib/location/coordinates';

export type LiveMapPin = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string | null;
};

type LiveMapProps = {
  pins?: LiveMapPin[];
  height?: number;
  style?: ViewStyle;
  /** Show street-level label under the map. Default true. */
  showAddress?: boolean;
};

const DEFAULT_DELTA = 0.012;

function regionFor(location: DeviceLocation, delta = DEFAULT_DELTA): Region {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function LiveMap({ pins = [], height = 280, style, showAddress = true }: LiveMapProps) {
  const colors = useScrapbookPalette();
  const mapRef = useRef<MapView | null>(null);
  const followUser = useRef(true);
  const { location, loading, error, permission, requestPermission, refresh } = useDeviceLocation({
    watch: true,
    highAccuracy: true,
  });
  const [address, setAddress] = useState<string | null>(null);

  const validPins = useMemo(
    () =>
      pins.filter((pin) =>
        isValidCoordinates({ latitude: pin.latitude, longitude: pin.longitude }),
      ),
    [pins],
  );

  useEffect(() => {
    if (!location || !showAddress) return;
    let cancelled = false;
    void reverseGeocodeLocation(location).then((place) => {
      if (!cancelled) setAddress(place?.label ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [location, showAddress]);

  useEffect(() => {
    if (!location || !followUser.current) return;
    mapRef.current?.animateToRegion(regionFor(location), 450);
  }, [location]);

  const initialRegion = location ? regionFor(location) : undefined;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, { height, borderColor: colors.line, backgroundColor: colors.paper }, style]}>
        <Text style={[styles.fallbackText, { color: colors.inkSoft }]}>
          live map is available in the iOS or Android app.
        </Text>
      </View>
    );
  }

  if (permission !== 'granted' && !loading) {
    return (
      <View style={[styles.fallback, { height, borderColor: colors.line, backgroundColor: colors.paper }, style]}>
        <Text style={[styles.fallbackText, { color: colors.inkSoft }]}>
          {error ?? 'allow location so the map can show where you are.'}
        </Text>
        {permission === 'undetermined' || permission === 'denied' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Allow location access"
            onPress={() => void requestPermission()}
            style={[styles.action, { borderColor: colors.butterDeep, backgroundColor: colors.butter }]}>
            <Text style={[styles.actionText, { color: colors.ink }]}>use my location</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.mapFrame, { height, borderColor: colors.line }]}>
        {initialRegion ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            followsUserLocation={followUser.current}
            onPanDrag={() => {
              followUser.current = false;
            }}>
            {validPins.map((pin) => (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
                title={pin.title}
                description={pin.subtitle ?? undefined}
              />
            ))}
          </MapView>
        ) : (
          <View style={[styles.loading, { backgroundColor: colors.paperWarm }]}>
            <Text style={[styles.fallbackText, { color: colors.inkSoft }]}>
              {loading ? 'finding you…' : 'waiting for GPS…'}
            </Text>
          </View>
        )}

        {location ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recenter map on my location"
            onPress={() => {
              followUser.current = true;
              mapRef.current?.animateToRegion(regionFor(location), 450);
              void refresh();
            }}
            style={[styles.recenter, { backgroundColor: colors.paper, borderColor: colors.line }]}>
            <Ionicons name="locate" size={18} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>

      {showAddress && address ? (
        <Text style={[styles.address, { color: colors.inkSoft }]}>you are near {address}</Text>
      ) : null}
      {error && permission === 'granted' ? (
        <Text style={[styles.address, { color: colors.inkSoft }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  mapFrame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  fallbackText: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    textAlign: 'center',
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionText: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
  },
  recenter: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    marginTop: 8,
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
});
