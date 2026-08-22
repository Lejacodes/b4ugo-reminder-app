import { daysBetween, parseIsoDate, todayIso } from '@/lib/trips/dates';
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
  weather?: CompactWeather | null;
}): LittleGuyMood {
  if (input.processing) return 'thinking';
  if (input.justCreatedTrip) return 'excited';
  if (input.justSaved) return 'happy';

  const open = input.reminders.filter((item) => item.status === 'open');
  const soon = input.upcomingTrips.some((trip) => {
    const start = parseIsoDate(trip.startDate);
    const today = parseIsoDate(todayIso());
    if (!start || !today) return false;
    const days = daysBetween(today, start);
    return days >= 0 && days <= 2;
  });

  if (input.unfinishedPacking > 0 && input.upcomingTrips.length > 0) return 'thinking';
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
  weather?: CompactWeather | null;
}): string | null {
  const open = input.reminders.filter((item) => item.status === 'open');
  const today = parseIsoDate(todayIso());
  const soon = input.upcomingTrips
    .map((trip) => {
      const start = parseIsoDate(trip.startDate);
      if (!start || !today) return null;
      return { trip, days: daysBetween(today, start) };
    })
    .filter((item): item is { trip: Trip; days: number } => item != null && item.days >= 0 && item.days <= 3)
    .sort((a, b) => a.days - b.days)[0];

  if (input.weather?.rainLikely) return 'looks like rain tomorrow...';
  if (soon) {
    if (soon.days === 0) return 'your trip is today ♡';
    if (soon.days === 1) return 'your trip is coming up ♡';
    return `your trip is in ${soon.days} days ♡`;
  }
  if (input.unfinishedPacking > 0 && input.upcomingTrips.length > 0) {
    return `you still have ${input.unfinishedPacking} thing${input.unfinishedPacking === 1 ? '' : 's'} left before your trip.`;
  }
  if (open.length === 1) return 'you have one little thing to remember today ♡';
  if (open.length > 1) return "you've got a few little things waiting for you today ♡";
  return null;
}
