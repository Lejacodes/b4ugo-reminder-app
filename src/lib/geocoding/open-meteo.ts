import { fetchJson } from '@/lib/api/http';
import type { PlaceLookup } from '@/lib/engines/contracts';

export type GeocodedDestination = {
  placeName: string;
  latitude: number;
  longitude: number;
  country: string | null;
  region: string | null;
  timezone: string | null;
};

export interface GeocodingService {
  searchDestination(query: string): Promise<GeocodedDestination | null>;
  searchPlaces(query: string): Promise<GeocodedDestination[]>;
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
  async searchPlaces(query: string): Promise<GeocodedDestination[]> {
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

  async searchDestination(query: string): Promise<GeocodedDestination | null> {
    const results = await this.searchPlaces(query);
    return results[0] ?? null;
  }
}

export const geocodingService: GeocodingService = new OpenMeteoGeocodingService();

export async function resolvePlace(placeName: string): Promise<PlaceLookup> {
  const trimmed = placeName.trim();
  const geo = trimmed ? await geocodingService.searchDestination(trimmed) : null;
  if (!geo) {
    return { placeName: trimmed, latitude: null, longitude: null };
  }
  return {
    placeName: geo.placeName,
    latitude: geo.latitude,
    longitude: geo.longitude,
  };
}
