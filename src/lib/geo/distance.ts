/** Earth radius in metres (mean). */
const EARTH_RADIUS_M = 6_371_000;

export const DEFAULT_PLACE_RADIUS_M = 150;
export const DEFAULT_HOME_RADIUS_M = 200;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinRadius(
  a: Coordinates,
  b: Coordinates,
  radiusMeters: number = DEFAULT_PLACE_RADIUS_M,
): boolean {
  if (radiusMeters < 0) return false;
  return distanceMeters(a, b) <= radiusMeters;
}
