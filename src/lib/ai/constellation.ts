import { titlesMatch } from '@/types/reminder';
import type { Reminder } from '@/types/reminder';
import type { Trip } from '@/types/trip';

import type { ConstellationKind, ConstellationPixel } from './types';

const BUY = /\b(buy|pick up|get|grab)\b/i;
const MAX_PIXELS = 8;

function kindForReminder(item: Reminder): ConstellationKind {
  if (item.dueAt) return 'important';
  if (item.category === 'onTheWayBack' || BUY.test(item.title)) return 'buy';
  if (item.category === 'beforeUgo') return 'task';
  return 'reminder';
}

export function buildConstellation(input: {
  reminders: Reminder[];
  upcomingTrips: Trip[];
  unfinishedPacking?: number;
}): ConstellationPixel[] {
  const pixels: ConstellationPixel[] = [];
  const seen = new Set<string>();

  const add = (pixel: ConstellationPixel) => {
    const key = `${pixel.kind}:${pixel.label.trim().toLowerCase()}`;
    if (seen.has(key) || pixels.length >= MAX_PIXELS) return;
    if (pixels.some((item) => titlesMatch(item.label, pixel.label))) return;
    seen.add(key);
    pixels.push(pixel);
  };

  for (const trip of input.upcomingTrips) {
    add({ id: `trip:${trip.id}`, kind: 'trip', label: trip.title || trip.destination });
  }

  for (const item of input.reminders.filter((reminder) => reminder.status === 'open')) {
    add({ id: item.id, kind: kindForReminder(item), label: item.title });
  }

  if ((input.unfinishedPacking ?? 0) > 0 && pixels.length < MAX_PIXELS) {
    add({
      id: 'packing-left',
      kind: 'task',
      label: `${input.unfinishedPacking} left to pack`,
    });
  }

  return pixels;
}

export const PIXEL_COLORS: Record<ConstellationKind, string> = {
  reminder: '#7BA3C9',
  buy: '#E4C36A',
  trip: '#E08A86',
  task: '#8FBF8A',
  important: '#A48BC4',
};
