import type { PackingItem, Trip } from '@/types/trip';

export type BoardTrip = Pick<Trip, 'id' | 'status' | 'startDate'>;

export function packingBoardId(packingItemId: string): string {
  return `pack:${packingItemId}`;
}

/**
 * Same-day departures and trips already in travel mode share one packing list
 * with Home. Archived trips never inject.
 */
export function isDepartingTrip(trip: BoardTrip, today: string): boolean {
  if (trip.status === 'archived') return false;
  if (trip.status === 'active') return true;
  return trip.startDate === today;
}

export function departingTrips<T extends BoardTrip>(trips: T[], today: string): T[] {
  return trips.filter((trip) => isDepartingTrip(trip, today));
}

/**
 * Packing rows for trips on today's doorway board.
 * Checked items stay visible so they can be swipe-deleted; sparks and
 * "still to pack" counts should keep filtering `!checked` themselves.
 */
export function packingItemsForHomeBoard(
  trips: BoardTrip[],
  packing: PackingItem[],
  today: string,
): PackingItem[] {
  const tripIds = new Set(departingTrips(trips, today).map((trip) => trip.id));
  return packing
    .filter((item) => tripIds.has(item.tripId) && !item.dismissed)
    .sort((a, b) => Number(a.checked) - Number(b.checked) || a.createdAt.localeCompare(b.createdAt));
}
