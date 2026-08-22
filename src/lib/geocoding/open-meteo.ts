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

export class OpenMeteoGeocodingService implements GeocodingService {
  async searchDestination(query: string): Promise<GeocodedDestination | null> {
    const name = query.trim();
    if (!name) return null;

    const url =
      'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(name) +
      '&count=1&language=en&format=json';
    const data = await fetchJson<OpenMeteoGeoResponse>(url);
    const hit = data?.results?.[0];
    if (!hit) return null;

    return {
      placeName: hit.name || name,
      latitude: hit.latitude,
      longitude: hit.longitude,
      country: hit.country ?? null,
      region: hit.admin1 ?? null,
      timezone: hit.timezone ?? null,
    };
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
