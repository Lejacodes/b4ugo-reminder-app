import {
  DEFAULT_HOME_RADIUS_M,
  DEFAULT_PLACE_RADIUS_M,
  isWithinRadius,
  type Coordinates,
} from '@/lib/geo/distance';
import { isValidCoordinates } from '@/lib/location/coordinates';

export type ProximityPlace = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type ProximityEvent =
  | { type: 'leftHome' }
  | { type: 'enteredPlace'; place: ProximityPlace }
  | { type: 'leftPlace'; place: ProximityPlace }
  | { type: 'nearTrip'; place: ProximityPlace };

export type ProximitySnapshot = {
  nearHome: boolean;
  nearPlaceIds: string[];
};

const PLACE_COOLDOWN_MS = 20 * 60 * 1000;
const HOME_LEAVE_COOLDOWN_MS = 30 * 60 * 1000;

export class ProximityTracker {
  private nearHome: boolean | null = null;
  private nearPlaceIds = new Set<string>();
  private lastLeftHomeAt = 0;
  private lastEnteredAt = new Map<string, number>();

  reset(): void {
    this.nearHome = null;
    this.nearPlaceIds.clear();
    this.lastLeftHomeAt = 0;
    this.lastEnteredAt.clear();
  }

  snapshot(): ProximitySnapshot {
    return { nearHome: this.nearHome === true, nearPlaceIds: [...this.nearPlaceIds] };
  }

  evaluate(input: {
    current: Coordinates;
    home: ProximityPlace | null;
    places: ProximityPlace[];
    now?: number;
    homeRadius?: number;
    placeRadius?: number;
  }): ProximityEvent[] {
    if (!isValidCoordinates(input.current)) return [];
    const now = input.now ?? Date.now();
    const events: ProximityEvent[] = [];
    const homeRadius = input.homeRadius ?? DEFAULT_HOME_RADIUS_M;
    const placeRadius = input.placeRadius ?? DEFAULT_PLACE_RADIUS_M;

    if (input.home?.latitude != null && input.home.longitude != null) {
      const inside = isWithinRadius(
        input.current,
        { latitude: input.home.latitude, longitude: input.home.longitude },
        homeRadius,
      );
      if (this.nearHome === true && !inside && now - this.lastLeftHomeAt >= HOME_LEAVE_COOLDOWN_MS) {
        this.lastLeftHomeAt = now;
        events.push({ type: 'leftHome' });
      }
      this.nearHome = inside;
    }

    for (const place of input.places) {
      if (place.latitude == null || place.longitude == null) continue;
      const inside = isWithinRadius(
        input.current,
        { latitude: place.latitude, longitude: place.longitude },
        placeRadius,
      );
      const wasInside = this.nearPlaceIds.has(place.id);
      if (inside && !wasInside) {
        const last = this.lastEnteredAt.get(place.id) ?? 0;
        if (now - last >= PLACE_COOLDOWN_MS) {
          this.lastEnteredAt.set(place.id, now);
          events.push({ type: 'enteredPlace', place });
        }
        this.nearPlaceIds.add(place.id);
      } else if (!inside && wasInside) {
        this.nearPlaceIds.delete(place.id);
        events.push({ type: 'leftPlace', place });
      }
    }

    return events;
  }
}

export const proximityTracker = new ProximityTracker();
