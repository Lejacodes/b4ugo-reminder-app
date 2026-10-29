import { searchPlacesNearby, type PlaceSearchOptions } from './nearby-search';
import {
  openMeteoGeocodingService,
  type GeocodedDestination,
  type GeocodingService,
} from './open-meteo';

class NearbyGeocodingService implements GeocodingService {
  async searchPlaces(query: string, options?: PlaceSearchOptions): Promise<GeocodedDestination[]> {
    if (options?.near) return searchPlacesNearby(query, options);
    return openMeteoGeocodingService.searchPlaces(query);
  }

  async searchDestination(query: string, options?: PlaceSearchOptions): Promise<GeocodedDestination | null> {
    const results = await this.searchPlaces(query, options);
    return results[0] ?? null;
  }
}

export const geocodingService: GeocodingService = new NearbyGeocodingService();

export {
  formatPlaceLabel,
  isTripPlaceSuggestion,
  openMeteoGeocodingService,
  resolvePlace,
  type GeocodedDestination,
  type GeocodingService,
} from './open-meteo';
export { formatDistance, sortByDistance, withDistance } from './distance-label';
export { searchPlacesNearby, type PlaceSearchOptions, type SavedPlaceHint } from './nearby-search';
export { reverseGeocodeLocation, type ReverseGeocodedPlace } from './reverse-geocode';
