import { Platform } from 'react-native';

import type { DeviceLocation } from '@/lib/engines/contracts';

export type ReverseGeocodedPlace = {
  label: string;
  street: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
};

function buildLabel(parts: (string | null | undefined)[]): string {
  return parts.filter((part) => part && part.trim().length > 0).join(', ');
}

/** Turn live GPS into a human label (street/neighborhood), not just a country. */
export async function reverseGeocodeLocation(
  location: DeviceLocation,
): Promise<ReverseGeocodedPlace | null> {
  if (Platform.OS === 'web') return null;
  try {
    const Location = await import('expo-location');
    const hits = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    const hit = hits[0];
    if (!hit) return null;

    const street = hit.street?.trim() || hit.name?.trim() || null;
    const city = hit.city?.trim() || hit.subregion?.trim() || null;
    const region = hit.region?.trim() || null;
    const country = hit.country?.trim() || null;
    const countryCode = hit.isoCountryCode?.trim()?.toLowerCase() || null;
    const label =
      buildLabel([street, city && city !== street ? city : null]) ||
      buildLabel([city, region && region !== city ? region : null]) ||
      country ||
      'here';

    return { label, street, city, region, country, countryCode };
  } catch {
    return null;
  }
}
