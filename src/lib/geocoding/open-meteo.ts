import { fetchJson } from '@/lib/api/http';
import type { PlaceLookup } from '@/lib/engines/contracts';

import { searchPlacesNearby, type PlaceSearchOptions } from './nearby-search';

export type GeocodedDestination = {
  placeName: string;
  latitude: number;
  longitude: number;
  country: string | null;
  region: string | null;
  timezone: string | null;
  /** Set when results are ranked from the user's GPS. */
  distanceMeters?: number;
};

export interface GeocodingService {
  searchDestination(query: string, options?: PlaceSearchOptions): Promise<GeocodedDestination | null>;
  searchPlaces(query: string, options?: PlaceSearchOptions): Promise<GeocodedDestination[]>;
}

type OpenMeteoGeoResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
};

function mapHit(
  hit: NonNullable<OpenMeteoGeoResponse['results']>[number],
  fallback: string,
): GeocodedDestination {
  return {
    placeName: hit.name || fallback,
    latitude: hit.latitude,
    longitude: hit.longitude,
    country: hit.country ?? null,
    region: hit.admin1 ?? null,
    timezone: hit.timezone ?? null,
  };
}

export function formatPlaceLabel(place: GeocodedDestination): string {
  if (place.country && place.country !== place.placeName) {
    return `${place.placeName}, ${place.country}`;
  }
  return place.placeName;
}

export function isTripPlaceSuggestion(place: GeocodedDestination): boolean {
  const country = place.country?.trim().toLowerCase();
  const name = place.placeName.trim().toLowerCase();
  return country !== 'israel' && name !== 'israel';
}

export class OpenMeteoGeocodingService implements GeocodingService {
  async searchPlaces(query: string, _options?: PlaceSearchOptions): Promise<GeocodedDestination[]> {
    const name = query.trim();
    if (!name) return [];

    const url =
      'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(name) +
      '&count=8&language=en&format=json';
    const data = await fetchJson<OpenMeteoGeoResponse>(url);
    return (data?.results ?? [])
      .map((hit) => mapHit(hit, name))
      .filter(isTripPlaceSuggestion)
      .slice(0, 6);
  }

  async searchDestination(
    query: string,
    options?: PlaceSearchOptions,
  ): Promise<GeocodedDestination | null> {
    const results = await this.searchPlaces(query, options);
    return results[0] ?? null;
  }
}

export const openMeteoGeocodingService: GeocodingService = new OpenMeteoGeocodingService();

export async function resolvePlace(placeName: string, options?: PlaceSearchOptions): Promise<PlaceLookup> {
  const trimmed = placeName.trim();
  const geo = trimmed
    ? options?.near
      ? ((await searchPlacesNearby(trimmed, options))[0] ?? null)
      : await openMeteoGeocodingService.searchDestination(trimmed)
    : null;
  if (!geo) {
    return { placeName: trimmed, latitude: null, longitude: null };
  }
  return {
    placeName: geo.placeName,
    latitude: geo.latitude,
    longitude: geo.longitude,
  };
}
