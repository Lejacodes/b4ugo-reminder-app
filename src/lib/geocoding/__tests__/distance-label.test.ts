import { formatDistance, sortByDistance } from '@/lib/geocoding/distance-label';
import type { GeocodedDestination } from '@/lib/geocoding/open-meteo';

const origin = { latitude: 36.8969, longitude: 30.7133 };

const antalya: GeocodedDestination = {
  placeName: 'Migros',
  latitude: 36.901,
  longitude: 30.72,
  country: 'Türkiye',
  region: 'Antalya',
  timezone: null,
};

const france: GeocodedDestination = {
  placeName: 'Migron',
  latitude: 46.2,
  longitude: -0.5,
  country: 'France',
  region: 'Nouvelle-Aquitaine',
  timezone: null,
};

describe('sortByDistance', () => {
  it('ranks closer places first and drops far ones', () => {
    const ranked = sortByDistance([france, antalya], origin, 50);
    expect(ranked[0]?.placeName).toBe('Migros');
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.distanceMeters).toBeLessThan(5000);
  });
});

describe('formatDistance', () => {
  it('formats metres and kilometres', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(2400)).toBe('2.4 km');
  });
});
