import type { Reminder } from '@/types/reminder';

export type TripExtraDraft = {
  title: string;
  layer: 'thisTrip' | 'suggestion';
  reason: string | null;
  source: Reminder['source'];
};

/**
 * Destination extras only. Personal necessities are never copied into reminder rows.
 */
export function uniqueTripExtraDrafts(input: {
  necessityTitles: string[];
  packingTitles?: string[];
  pack: { title: string; reason?: string | null }[];
  suggestions: { title: string; reason: string; source: Reminder['source'] }[];
  destination: string;
}): TripExtraDraft[] {
  const taken = new Set(
    [...input.necessityTitles, ...(input.packingTitles ?? [])]
      .map((title) => title.trim().toLowerCase())
      .filter(Boolean),
  );
  const out: TripExtraDraft[] = [];

  const push = (draft: TripExtraDraft) => {
    const key = draft.title.trim().toLowerCase();
    if (!key || taken.has(key)) return;
    taken.add(key);
    out.push({ ...draft, title: draft.title.trim() });
  };

  for (const item of input.pack) {
    push({
      title: item.title,
      layer: 'thisTrip',
      reason: item.reason ?? `for ${input.destination}`,
      source: 'rule',
    });
  }

  for (const item of input.suggestions) {
    push({
      title: item.title,
      layer: 'suggestion',
      reason: item.reason,
      source: item.source,
    });
  }

  return out;
}
