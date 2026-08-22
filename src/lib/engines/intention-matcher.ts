/**
 * Future "you wanted to try this nearby" matcher.
 * No GPS. nearby() always returns [].
 */
import type { IntentionMatcher } from './trip-contracts';
import type { TravelIntention } from '@/types/trip';

export class LocalIntentionMatcher implements IntentionMatcher {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async nearby(_intentions: TravelIntention[]): Promise<TravelIntention[]> {
    return [];
  }
}

export const intentionMatcher = new LocalIntentionMatcher();
