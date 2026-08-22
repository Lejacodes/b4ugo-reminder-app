import { titlesMatch } from '@/types/reminder';
import type { PackingItem } from '@/types/trip';
import type { PersonalNecessity } from '@/types/reminder';

/** Titles packed on a trip — never writes back to personal necessities. */
export function packedTitlesForTrip(items: PackingItem[], tripId: string): Set<string> {
  const packed = new Set<string>();
  for (const item of items) {
    if (item.tripId !== tripId || item.dismissed || !item.checked) continue;
    packed.add(item.title.trim().toLowerCase());
  }
  return packed;
}

export function necessityOpenForTrip(
  necessity: PersonalNecessity,
  packedTitles: Set<string>,
): boolean {
  return !packedTitles.has(necessity.title.trim().toLowerCase());
}

export function packingOpenForTrip(items: PackingItem[], tripId: string): PackingItem[] {
  return items.filter((item) => item.tripId === tripId && !item.dismissed && !item.checked);
}

export function titleAlreadyListed(title: string, listed: string[]): boolean {
  return listed.some((item) => titlesMatch(item, title));
}
