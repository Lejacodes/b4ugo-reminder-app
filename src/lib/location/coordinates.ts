import type { Coordinates } from '@/lib/geo/distance';

export function isValidCoordinates(value: {
  latitude?: unknown;
  longitude?: unknown;
} | null | undefined): value is Coordinates {
  if (!value) return false;
  const { latitude, longitude } = value;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}
