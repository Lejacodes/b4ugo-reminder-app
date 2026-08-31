import { titlesMatch } from '@/types/reminder';

import type { AIContextSnapshot } from './types';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function includesHint(haystack: string, needle: string): boolean {
  const a = haystack.trim().toLowerCase();
  const b = needle.trim().toLowerCase();
  return a.includes(b) || b.includes(a) || titlesMatch(a, b);
}

export function resolveReminderId(
  context: AIContextSnapshot,
  args: Record<string, unknown>,
): string | null {
  const id = text(args.id);
  if (id) return context.reminders.some((item) => item.id === id) ? id : id;
  const hint = text(args.title) || text(args.hint);
  if (!hint) return null;
  return context.reminders.find((item) => includesHint(item.title, hint))?.id ?? null;
}

export function resolveTripId(context: AIContextSnapshot, args: Record<string, unknown>): string | null {
  const id = text(args.id) || text(args.tripId);
  if (id) return context.trips.some((trip) => trip.id === id) ? id : id;
  const hint = text(args.destination) || text(args.title) || text(args.hint);
  if (!hint) return null;
  return (
    context.trips.find(
      (trip) =>
        includesHint(trip.destination, hint) ||
        includesHint(trip.title, hint),
    )?.id ?? null
  );
}

export function resolvePlaceId(context: AIContextSnapshot, args: Record<string, unknown>): string | null {
  const id = text(args.id);
  if (id) return context.places.some((place) => place.id === id) ? id : id;
  const hint = text(args.name) || text(args.hint);
  if (!hint) return null;
  return context.places.find((place) => includesHint(place.name, hint))?.id ?? null;
}

export function resolveIntentionId(context: AIContextSnapshot, args: Record<string, unknown>): string | null {
  const id = text(args.id);
  if (id) return context.intentions.some((item) => item.id === id) ? id : id;
  const hint = text(args.title) || text(args.hint);
  if (!hint) return null;
  return context.intentions.find((item) => includesHint(item.title, hint))?.id ?? null;
}

export function resolvePackingItemId(context: AIContextSnapshot, args: Record<string, unknown>): string | null {
  const id = text(args.id);
  if (id) return context.packing.some((item) => item.id === id) ? id : id;
  const hint = text(args.title) || text(args.hint);
  const tripId = resolveTripId(context, args);
  if (!hint) return null;
  const scoped = tripId ? context.packing.filter((item) => item.tripId === tripId) : context.packing;
  return scoped.find((item) => includesHint(item.title, hint))?.id ?? null;
}

export function isExplicitConfirm(value: unknown): boolean {
  const confirm = text(value).toLowerCase();
  return confirm === 'yes' || confirm === 'y' || confirm === 'delete' || confirm === 'remove';
}
