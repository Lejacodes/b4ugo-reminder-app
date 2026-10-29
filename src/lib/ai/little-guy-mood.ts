import { daysBetween, parseIsoDate } from '@/lib/trips/dates';
import type { Reminder } from '@/types/reminder';
import type { Trip } from '@/types/trip';

import type { CompactWeather, LittleGuyMood } from './types';

/** Above this many open reminders he starts to look a little preoccupied. */
const BUSY_REMINDERS = 4;

export function moodFromSituation(input: {
  processing?: boolean;
  justSaved?: boolean;
  justCreatedTrip?: boolean;
  reminders: Reminder[];
  upcomingTrips: Trip[];
  unfinishedPacking: number;
  today: string;
  weather?: CompactWeather | null;
}): LittleGuyMood {
  if (input.processing) return 'thinking';
  if (input.justCreatedTrip) return 'excited';
  if (input.justSaved) return 'happy';

  const open = input.reminders.filter((item) => item.status === 'open');
  const today = parseIsoDate(input.today);
  const hasCurrentOrFutureTrip = input.upcomingTrips.some((trip) => {
    const end = parseIsoDate(trip.endDate ?? trip.startDate);
    return Boolean(today && end && daysBetween(today, end) >= 0);
  });
  const soon = input.upcomingTrips.some((trip) => {
    const start = parseIsoDate(trip.startDate);
    if (!start || !today) return false;
    const days = daysBetween(today, start);
    return days >= 0 && days <= 2;
  });

  if (input.unfinishedPacking > 0 && hasCurrentOrFutureTrip) return 'thinking';
  if (soon) return 'excited';
  if (open.length >= BUSY_REMINDERS) return 'thinking';
  if (open.length > 0) return 'remembering';
  if (input.upcomingTrips.length > 0) return 'proud';
  if (open.length === 0 && input.upcomingTrips.length === 0) return 'sleepy';
  return 'idle';
}

export function littleGuyWhisper(input: {
  reminders: Reminder[];
  upcomingTrips: Trip[];
  unfinishedPacking: number;
  today: string;
  weather?: CompactWeather | null;
}): string | null {
  const today = parseIsoDate(input.today);
  const hasCurrentOrFutureTrip = input.upcomingTrips.some((trip) => {
    const end = parseIsoDate(trip.endDate ?? trip.startDate);
    return Boolean(today && end && daysBetween(today, end) >= 0);
  });
  const soon = input.upcomingTrips
    .map((trip) => {
      const start = parseIsoDate(trip.startDate);
      if (!start || !today) return null;
      return { trip, days: daysBetween(today, start) };
    })
    .filter((item): item is { trip: Trip; days: number } => {
      if (!item || !today) return false;
      const start = parseIsoDate(item.trip.startDate);
      return Boolean(start && item.days >= 0 && item.days <= 3);
    })
    .sort((a, b) => a.days - b.days)[0];

  if (input.weather?.rainLikely) return 'looks like rain tomorrow...';
  if (soon) {
    if (soon.days === 0) return 'your trip is today ♡';
    if (soon.days === 1) return 'your trip is coming up ♡';
    return `your trip is in ${soon.days} days ♡`;
  }
  if (input.unfinishedPacking > 0 && hasCurrentOrFutureTrip) {
    return `you still have ${input.unfinishedPacking} thing${input.unfinishedPacking === 1 ? '' : 's'} left before your trip.`;
  }
  return null;
}
