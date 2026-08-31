import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { readableType, TEXT_FONT } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import {
  formatDistance,
  formatPlaceLabel,
  geocodingService,
  reverseGeocodeLocation,
  type GeocodedDestination,
} from '@/lib/geocoding';
import type { Coordinates } from '@/lib/geo/distance';
import { deviceLocationService } from '@/lib/location/device-location';
import { usePlaces } from '@/store/PlaceProvider';

import { PaperField } from './PaperField';
import { QuietLink } from './QuietLink';

type PlaceAutocompleteProps = {
  label?: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelect?: (place: GeocodedDestination | null) => void;
  /** Bias toward the user's GPS. Default true. */
  preferNearby?: boolean;
  /** Drop results farther than this from the user. Default 50 km. */
  maxDistanceKm?: number;
};

export function PlaceAutocomplete({
  label,
  hint,
  placeholder,
  value,
  onChangeText,
  onSelect,
  preferNearby = true,
  maxDistanceKm = 50,
}: PlaceAutocompleteProps) {
  const palette = useScrapbookPalette();
  const { places } = usePlaces();
  const [suggestions, setSuggestions] = useState<GeocodedDestination[]>([]);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [usingGps, setUsingGps] = useState(false);
  const requestId = useRef(0);
  /** When set, the field value came from a pick — do not re-run forward search on it. */
  const lockedTextRef = useRef<string | null>(null);

  const savedPlaces = useMemo(
    () =>
      places.map((place) => ({
        id: place.id,
        name: place.name,
        label: place.label,
        latitude: place.latitude,
        longitude: place.longitude,
      })),
    [places],
  );

  useEffect(() => {
    if (!preferNearby) return;
    let cancelled = false;

    async function loadOrigin() {
      const status = await deviceLocationService.getPermissionStatus();
      const granted =
        status === 'granted' || (await deviceLocationService.requestPermission()) === 'granted';
      if (!granted || cancelled) return;

      const here = await deviceLocationService.getCurrentPosition({ highAccuracy: true });
      if (!here || cancelled) return;

      setOrigin(here);
      const labelInfo = await reverseGeocodeLocation(here);
      if (!cancelled && labelInfo?.countryCode) setCountryCode(labelInfo.countryCode);
    }

    void loadOrigin();
    return () => {
      cancelled = true;
    };
  }, [preferNearby]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (lockedTextRef.current === query) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    lockedTextRef.current = null;
    setUsingGps(false);

    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const results = await geocodingService.searchPlaces(query, {
          near: preferNearby && origin ? origin : undefined,
          maxDistanceKm: preferNearby ? maxDistanceKm : undefined,
          countryCode,
          savedPlaces,
        });
        if (current !== requestId.current) return;
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        if (current !== requestId.current) return;
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [countryCode, maxDistanceKm, origin, preferNearby, savedPlaces, value]);

  const applySelection = (text: string, picked: GeocodedDestination, fromGps = false) => {
    lockedTextRef.current = text.trim();
    onChangeText(text);
    onSelect?.(picked);
    setSuggestions([]);
    setOpen(false);
    setUsingGps(fromGps);
    setLocateError(null);
  };

  const useCurrentLocation = async () => {
    setLocateError(null);
    setLocating(true);
    try {
      const permission = await deviceLocationService.requestPermission();
      if (permission !== 'granted') {
        setLocateError('allow location to find places near you.');
        return;
      }
      const here = await deviceLocationService.getCurrentPosition({ highAccuracy: true });
      if (!here) {
        setLocateError('could not read your location.');
        return;
      }
      setOrigin(here);
      const labelInfo = await reverseGeocodeLocation(here);
      if (labelInfo?.countryCode) setCountryCode(labelInfo.countryCode);
      const placeName = labelInfo?.label ?? 'here';
      const picked: GeocodedDestination = {
        placeName,
        latitude: here.latitude,
        longitude: here.longitude,
        country: labelInfo?.country ?? null,
        region: labelInfo?.region ?? null,
        timezone: null,
        distanceMeters: 0,
      };
      applySelection(placeName, picked, true);
    } finally {
      setLocating(false);
    }
  };

  const nearbyHint =
    preferNearby && origin
      ? 'showing places near you'
      : preferNearby
        ? 'allow location for nearby places'
        : undefined;

  return (
    <View style={styles.wrap}>
      <PaperField
        label={label}
        hint={hint ?? nearbyHint}
        placeholder={placeholder}
        value={value}
        onChangeText={(next) => {
          if (lockedTextRef.current !== next.trim()) {
            lockedTextRef.current = null;
            setUsingGps(false);
          }
          onChangeText(next);
          onSelect?.(null);
          setOpen(true);
        }}
        autoCapitalize="sentences"
        autoCorrect={false}
        accessibilityLabel={label ?? 'Place'}
      />
      {preferNearby ? (
        <QuietLink
          label={locating ? 'finding you…' : 'use where i am now'}
          accessibilityLabel="Use my current location"
          disabled={locating}
          onPress={() => void useCurrentLocation()}
        />
      ) : null}
      {usingGps ? (
        <Text style={[styles.gpsConfirm, { color: palette.inkSoft }]}>
          using your current location
        </Text>
      ) : null}
      {locateError ? <Text style={[styles.locateError, { color: palette.inkSoft }]}>{locateError}</Text> : null}
      {open && suggestions.length > 0 ? (
        <View
          style={[
            styles.list,
            {
              backgroundColor: palette.paper,
              borderColor: palette.line,
              shadowColor: palette.ink,
            },
          ]}>
          {suggestions.map((place, index) => {
            const labelText = formatPlaceLabel(place);
            const distance =
              place.distanceMeters != null ? formatDistance(place.distanceMeters) : null;
            const metaParts = [
              distance ? `${distance} away` : null,
              place.region && place.region !== 'saved place' && place.region !== place.placeName
                ? place.region
                : null,
              place.region === 'saved place' ? 'saved' : null,
              place.country,
            ].filter(Boolean);
            return (
              <Pressable
                key={`${place.latitude}-${place.longitude}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={labelText}
                onPress={() => {
                  applySelection(labelText, place);
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: palette.line },
                  index === suggestions.length - 1 && styles.rowLast,
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.rowTitle, { color: palette.ink }]}>{place.placeName}</Text>
                {metaParts.length ? (
                  <Text style={[styles.rowMeta, { color: palette.inkSoft }]}>
                    {metaParts.join(' · ')}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
  },
  list: {
    marginTop: -12,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
  },
  rowMeta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 1,
  },
  gpsConfirm: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 4,
  },
  locateError: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
