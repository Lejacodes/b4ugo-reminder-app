import { isDepartingTrip, type BoardTrip } from '@/lib/home/departing-trips';
import { sessionCheckKey } from '@/lib/home/departure-session';
import { isNecessityActiveToday } from '@/lib/reminders/necessity-days';
import { toIsoDate } from '@/lib/trips/dates';
import type { PersonalNecessity, Reminder } from '@/types/reminder';
import type { PackingItem } from '@/types/trip';

import type { ConstellationKind, ConstellationPixel } from './types';

/** Hard cap so the orbit stays readable around Little Guy. */
export const CONSTELLATION_MAX = 10;

export const PIXEL_COLORS: Record<ConstellationKind, string> = {
  urgent: '#E56B6F',
  due: '#F4A261',
  errand: '#6E8B6B',
  nearby: '#2A9D8F',
  necessity: '#E9C46A',
  general: '#D4A373',
  trip: '#457B9D',
};

type Candidate = ConstellationPixel & {
  rank: number;
  tie: string;
};

export type BuildConstellationInput = {
  reminders: Reminder[];
  necessities?: PersonalNecessity[];
  sessionChecks?: Record<string, boolean>;
  sessionCleared?: string[];
  packingItems?: PackingItem[];
  trips?: BoardTrip[];
  today: string;
  /** True when a going-to context is set or a trip is departing / active. */
  departureActive?: boolean;
};

function dueProximity(dueAt: string | null | undefined, today: string): 'overdue' | 'today' | 'future' | null {
  if (!dueAt) return null;
  const day = dueAt.slice(0, 10);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(day)
    ? day
    : (() => {
        const parsed = new Date(dueAt);
        if (Number.isNaN(parsed.getTime())) return null;
        return toIsoDate(new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())));
      })();
  if (!iso) return null;
  if (iso < today) return 'overdue';
  if (iso === today) return 'today';
  return 'future';
}

function isNearbyErrand(item: Reminder): boolean {
  const place = item.location?.placeName?.trim();
  if (place) return true;
  return item.location?.latitude != null && item.location?.longitude != null;
}

function kindForOpenReminder(
  item: Reminder,
  today: string,
  departureActive: boolean,
): { kind: ConstellationKind; rank: number } | null {
  if (item.category === 'onTheWayBack') {
    const nearby = isNearbyErrand(item);
    return nearby ? { kind: 'nearby', rank: 2 } : { kind: 'errand', rank: 3 };
  }

  const due = dueProximity(item.dueAt, today);
  if (due === 'overdue') return { kind: 'urgent', rank: 0 };
  if (due === 'today') return { kind: 'due', rank: 1 };
  if (due === 'future') return { kind: 'trip', rank: 6 };

  if (item.category === 'beforeUgo' && departureActive) {
    return { kind: 'due', rank: 1 };
  }
  if (item.category === 'beforeUgo') {
    return { kind: 'general', rank: 4 };
  }

  // Open specific items without a due date still spark as a persistent note.
  return { kind: 'general', rank: 4 };
}

/**
 * One spark per unresolved item Little Guy is holding: Before U Go rows,
 * On the Way Back errands, persistent necessities that are still unchecked
 * this departure, and packing left on today's (or a future) trip.
 */
export function buildConstellation(input: BuildConstellationInput): ConstellationPixel[] {
  const trips = input.trips ?? [];
  const packingItems = input.packingItems ?? [];
  const necessities = input.necessities ?? [];
  const sessionChecks = input.sessionChecks ?? {};
  const sessionCleared = new Set(input.sessionCleared ?? []);
  const departing = trips.some((trip) => isDepartingTrip(trip, input.today));
  const departureActive = input.departureActive ?? departing;
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));

  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  const add = (candidate: Candidate) => {
    if (seen.has(candidate.id)) return;
    seen.add(candidate.id);
    candidates.push(candidate);
  };

  for (const item of packingItems) {
    if (item.checked || item.dismissed) continue;
    const trip = tripById.get(item.tripId);
    if (!trip || trip.status === 'archived') continue;
    if (isDepartingTrip(trip, input.today)) {
      add({
        id: `pack:${item.id}`,
        kind: 'due',
        label: item.title,
        rank: 1,
        tie: item.createdAt,
      });
      continue;
    }
    if (trip.startDate && trip.startDate > input.today) {
      add({
        id: `pack:${item.id}`,
        kind: 'trip',
        label: item.title,
        rank: 6,
        tie: item.createdAt,
      });
    }
  }

  for (const item of input.reminders) {
    if (item.status !== 'open') continue;
    const mapped = kindForOpenReminder(item, input.today, departureActive);
    if (!mapped) continue;
    add({
      id: item.id,
      kind: mapped.kind,
      label: item.title,
      rank: mapped.rank,
      tie: item.createdAt,
    });
  }

  for (const item of necessities) {
    if (!isNecessityActiveToday(item, new Date().getDay())) continue;
    const key = sessionCheckKey('nec', item.id);
    if (sessionChecks[key] === true || sessionCleared.has(key)) continue;
    add({
      id: `nec:${item.id}`,
      kind: 'necessity',
      label: item.title,
      rank: 5,
      tie: item.createdAt,
    });
  }

  candidates.sort((a, b) => a.rank - b.rank || a.tie.localeCompare(b.tie) || a.id.localeCompare(b.id));

  return candidates.slice(0, CONSTELLATION_MAX).map(({ id, kind, label }) => ({ id, kind, label }));
}
