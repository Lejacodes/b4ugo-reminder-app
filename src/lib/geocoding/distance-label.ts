import { distanceMeters, type Coordinates } from '@/lib/geo/distance';

import type { GeocodedDestination } from './open-meteo';

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 950) return `${Math.round(meters)} m`;
  if (meters < 9_500) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

export function withDistance(
  place: GeocodedDestination,
  origin: Coordinates,
): GeocodedDestination {
  return {
    ...place,
    distanceMeters: distanceMeters(origin, place),
  };
}

export function sortByDistance(
  places: GeocodedDestination[],
  origin: Coordinates,
  maxDistanceKm?: number,
): GeocodedDestination[] {
  const maxMeters = maxDistanceKm != null ? maxDistanceKm * 1000 : null;
  return places
    .map((place) => withDistance(place, origin))
    .filter((place) => maxMeters == null || (place.distanceMeters ?? Infinity) <= maxMeters)
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
}
