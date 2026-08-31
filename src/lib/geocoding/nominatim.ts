import type { Coordinates } from '@/lib/geo/distance';

import type { GeocodedDestination } from './open-meteo';

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    shop?: string;
    supermarket?: string;
    amenity?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

function mapNominatimHit(hit: NominatimHit, fallback: string): GeocodedDestination | null {
  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const address = hit.address ?? {};
  const placeName =
    hit.name?.trim() ||
    address.shop?.trim() ||
    address.supermarket?.trim() ||
    address.amenity?.trim() ||
    hit.display_name?.split(',')[0]?.trim() ||
    fallback;

  return {
    placeName,
    latitude,
    longitude,
    country: address.country ?? null,
    region: address.state ?? address.city ?? address.town ?? address.suburb ?? null,
    timezone: null,
  };
}

async function fetchNominatim(url: string): Promise<NominatimHit[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BLUGO/1.0 (b4ugo-reminder-app)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimHit[] | NominatimHit;
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Forward search biased toward the user's coordinates (shops, streets, POIs). */
export async function searchNominatimPlaces(
  query: string,
  options?: {
    near?: Coordinates;
    countryCode?: string | null;
    limit?: number;
  },
): Promise<GeocodedDestination[]> {
  const name = query.trim();
  if (!name) return [];

  const params = new URLSearchParams({
    q: name,
    format: 'json',
    limit: String(options?.limit ?? 10),
    addressdetails: '1',
  });

  if (options?.near) {
    params.set('lat', String(options.near.latitude));
    params.set('lon', String(options.near.longitude));
  }
  if (options?.countryCode) {
    params.set('countrycodes', options.countryCode.toLowerCase());
  }

  const hits = await fetchNominatim(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!hits?.length) return [];

  const seen = new Set<string>();
  const results: GeocodedDestination[] = [];
  for (const hit of hits) {
    const mapped = mapNominatimHit(hit, name);
    if (!mapped) continue;
    const key = `${mapped.latitude.toFixed(4)}:${mapped.longitude.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(mapped);
  }
  return results;
}
