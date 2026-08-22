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

export type WeatherSnapshot = {
  /** False until a real weather API is connected. */
  isLive: boolean;
  rainLikely: boolean;
  temperatureC: number | null;
  summary: string;
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
  getSnapshot(): Promise<WeatherSnapshot | null>;
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
