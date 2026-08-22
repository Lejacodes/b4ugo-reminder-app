/**
 * Mock journey data for the Home screen.
 *
 * REPLACE THIS when the reminder engine exists. Nothing here is persisted,
 * geofenced, or synced — it exists only to teach the product concept on Home.
 */
import type { HomeJourneyData } from '@/types/home';

const HOME_MOCK_DATA: HomeJourneyData = {
  beforeUgo: [
    { id: 'bug-1', label: 'Laptop' },
    { id: 'bug-2', label: 'Gym clothes' },
    { id: 'bug-3', label: 'Charger' },
  ],
  onTheWayBack: [
    { id: 'owb-1', label: 'Buy cat food', placeName: 'Carrefour' },
    { id: 'owb-2', label: 'Pick up package', placeName: 'Post Office' },
  ],
  today: {
    thingsWaiting: 2,
    placesNearby: 1,
    upcomingTrip: {
      destination: 'Thailand',
      daysUntil: 4,
    },
  },
};

/** Returns the current Home dataset. Swap the body for a real fetch later. */
export function getHomeMockData(): HomeJourneyData {
  return HOME_MOCK_DATA;
}

/** "3 things waiting" / "1 thing waiting" */
export function formatThingsWaiting(count: number): string {
  const noun = count === 1 ? 'thing' : 'things';
  return `${count} ${noun} waiting`;
}

/** "1 place nearby" / "2 places nearby" */
export function formatPlacesNearby(count: number): string {
  const noun = count === 1 ? 'place' : 'places';
  return `${count} ${noun} nearby`;
}

/** "Thailand in 4 days" / "Thailand tomorrow" */
export function formatTripCountdown(destination: string, daysUntil: number): string {
  if (daysUntil <= 0) return `${destination} today`;
  if (daysUntil === 1) return `${destination} tomorrow`;
  return `${destination} in ${daysUntil} days`;
}
