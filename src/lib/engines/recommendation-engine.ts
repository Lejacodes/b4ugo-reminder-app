/**
 * Future travel recommendations. Always empty — no popularity, AI, or live feed.
 */
import type { RecommendationEngine, TravelRecommendation, TripContext } from './trip-contracts';

export class LocalRecommendationEngine implements RecommendationEngine {
  isLive(): boolean {
    return false;
  }

  recommend(_trip: TripContext): TravelRecommendation[] {
    return [];
  }
}

export const recommendationEngine = new LocalRecommendationEngine();
