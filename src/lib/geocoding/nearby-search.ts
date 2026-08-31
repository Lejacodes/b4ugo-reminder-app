import type { Coordinates } from '@/lib/geo/distance';
import { isValidCoordinates } from '@/lib/location/coordinates';

import { sortByDistance } from './distance-label';
import { searchNominatimPlaces } from './nominatim';
import {
  openMeteoGeocodingService,
  isTripPlaceSuggestion,
  type GeocodedDestination,
} from './open-meteo';

export type SavedPlaceHint = {
  id: string;
  name: string;
  label?: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PlaceSearchOptions = {
  near?: Coordinates;
  maxDistanceKm?: number;
  countryCode?: string | null;
  savedPlaces?: SavedPlaceHint[];
};

const DEFAULT_NEARBY_KM = 50;

function dedupeKey(place: GeocodedDestination): string {
  return `${place.placeName.toLowerCase()}@${place.latitude.toFixed(3)}:${place.longitude.toFixed(3)}`;
}

function matchSavedPlaces(query: string, saved: SavedPlaceHint[], origin: Coordinates): GeocodedDestination[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return saved.flatMap((place) => {
    if (!isValidCoordinates({ latitude: place.latitude, longitude: place.longitude })) return [];
    const hay = `${place.name} ${place.label ?? ''}`.toLowerCase();
    if (!hay.includes(needle)) return [];
    return [
      {
        placeName: place.label?.trim() || place.name,
        latitude: place.latitude!,
        longitude: place.longitude!,
        country: null,
        region: 'saved place',
        timezone: null,
      },
    ];
  }).filter((place) => isTripPlaceSuggestion(place));
}

/** Search places near the user first — not random cities on another continent. */
export async function searchPlacesNearby(
  query: string,
  options: PlaceSearchOptions = {},
): Promise<GeocodedDestination[]> {
  const name = query.trim();
  if (!name) return [];

  const maxDistanceKm = options.maxDistanceKm ?? DEFAULT_NEARBY_KM;
  const origin = options.near;

  const [nominatim, openMeteo] = await Promise.all([
    origin
      ? searchNominatimPlaces(name, {
          near: origin,
          countryCode: options.countryCode,
          limit: 12,
        })
      : Promise.resolve([]),
    openMeteoGeocodingService.searchPlaces(name),
  ]);

  const merged: GeocodedDestination[] = [];
  const seen = new Set<string>();

  const push = (place: GeocodedDestination) => {
    if (!isTripPlaceSuggestion(place)) return;
    const key = dedupeKey(place);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(place);
  };

  if (origin) {
    for (const place of matchSavedPlaces(name, options.savedPlaces ?? [], origin)) {
      push(place);
    }
  }

  for (const place of nominatim) push(place);
  for (const place of openMeteo) push(place);

  if (!origin) return merged.slice(0, 6);

  const ranked = sortByDistance(merged, origin, maxDistanceKm);
  const dedupedByName = dedupeByPlaceName(ranked.length ? ranked : sortByDistance(merged, origin));
  if (dedupedByName.length) return dedupedByName.slice(0, 8);

  return sortByDistance(merged, origin).slice(0, 4);
}

function dedupeByPlaceName(places: GeocodedDestination[]): GeocodedDestination[] {
  const byName = new Map<string, GeocodedDestination[]>();
  for (const place of places) {
    const key = place.placeName.trim().toLowerCase();
    const bucket = byName.get(key) ?? [];
    bucket.push(place);
    byName.set(key, bucket);
  }

  const out: GeocodedDestination[] = [];
  for (const bucket of byName.values()) {
    bucket.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    out.push(bucket[0]!);
    if (bucket.length > 1 && bucket[1] && (bucket[1].distanceMeters ?? 0) > 400) {
      out.push(bucket[1]);
    }
  }

  return out.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}
