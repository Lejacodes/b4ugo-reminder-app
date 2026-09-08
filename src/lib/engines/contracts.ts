/**
 * Service contracts for BLUGO's memory engines.
 *
 * UI code talks to these interfaces. Today's implementations are local
 * (rules + secure storage). Live weather, GPS, Places, geofencing,
 * notifications, and AI are NOT wired — swapping a file behind the
 * interface is the intended upgrade path.
 */

import type {
  BeforeUgoContext,
  ContextInput,
  CreateReminderInput,
  Reminder,
  ReminderLocation,
} from '@/types/reminder';

export type WeatherQuery = {
  latitude: number;
  longitude: number;
};

export type WeatherSnapshot = {
  /** False when the snapshot did not come from a live forecast. */
  isLive: boolean;
  rainLikely: boolean;
  temperatureC: number | null;
  summary: string;
  /** Today's max precipitation probability, 0–100. */
  precipitationProbability?: number | null;
  /** Today's max UV index when the forecast includes it. */
  uvIndex?: number | null;
};

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type PlaceLookup = {
  placeName: string;
  latitude: number | null;
  longitude: number | null;
};

export type TripPackItem = {
  title: string;
  reason?: string;
};

export type SuggestionItem = {
  title: string;
  reason: string;
  source: 'rule' | 'weather';
};

export interface ReminderEngine {
  list(): Promise<Reminder[]>;
  saveAll(reminders: Reminder[]): Promise<void>;
  add(input: CreateReminderInput): Promise<Reminder>;
  toggle(id: string): Promise<Reminder | null>;
}

export interface ContextEngine {
  getCurrent(): Promise<BeforeUgoContext | null>;
  setCurrent(input: ContextInput): Promise<BeforeUgoContext>;
  clear(): Promise<void>;
}

export interface SuggestionEngine {
  /**
   * Items for "for this trip", derived from destination/purpose the user typed.
   * Not invented until a context exists.
   */
  getTripPack(context: BeforeUgoContext): TripPackItem[];
  /**
   * Optional extras (weather stub, time-of-day rules). Never a live model.
   */
  getSuggestions(
    context: BeforeUgoContext,
    weather: WeatherSnapshot | null,
    existingTitles: string[],
  ): SuggestionItem[];
}

export interface WeatherService {
  getSnapshot(query?: WeatherQuery): Promise<WeatherSnapshot | null>;
}

export interface LocationService {
  /** Always false until permission + GPS are implemented. */
  isAvailable(): Promise<boolean>;
  getCurrentPosition(): Promise<DeviceLocation | null>;
}

export interface PlaceService {
  /**
   * Resolve a typed place name. Local impl stores the name only —
   * no Maps/Places network call.
   */
  resolve(placeName: string): Promise<PlaceLookup>;
}

export interface GeofenceService {
  isAvailable(): Promise<boolean>;
  /** No-op until background location exists. */
  watch(reminders: Reminder[]): Promise<void>;
}

export interface NotificationService {
  isAvailable(): Promise<boolean>;
  /** No-op until push/local notifications exist. */
  notifyNearby(reminder: Reminder, location: ReminderLocation): Promise<void>;
}
