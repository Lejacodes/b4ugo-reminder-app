/**
 * Trip-side engine contracts. UI talks to these; today's implementations
 * are local rules. Weather APIs, GPS, Maps, and recommendation models
 * are not connected.
 */
import type { WeatherSnapshot } from './contracts';
import type { PackingSuggestion, TravelIntention, Trip } from '@/types/trip';

export type TripContext = Pick<
  Trip,
  | 'title'
  | 'destination'
  | 'durationDays'
  | 'activity'
  | 'season'
  | 'accommodation'
  | 'transportation'
  | 'notes'
  | 'startDate'
>;

export interface PackingAssistant {
  generate(input: {
    trip: TripContext;
    personalNecessities: string[];
    existingTitles: string[];
    weather: WeatherSnapshot | null;
  }): PackingSuggestion[];
}

export type TravelRecommendation = {
  title: string;
  type: TravelIntention['type'];
  reason: string;
};

export interface RecommendationEngine {
  /** Always empty until a real recommendation service exists. */
  isLive(): boolean;
  recommend(trip: TripContext): TravelRecommendation[];
}

export interface IntentionMatcher {
  /** Always false until device location is connected. */
  isAvailable(): Promise<boolean>;
  nearby(intentions: TravelIntention[]): Promise<TravelIntention[]>;
}
