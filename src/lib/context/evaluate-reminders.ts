import { necessityOpenForTrip, packedTitlesForTrip, packingOpenForTrip } from '@/lib/context/necessities';
import { routineMatchesContext } from '@/lib/context/routines';
import type { AppContext, RankedReminder, ReminderPriority } from '@/types/context';
import type { PersonalNecessity, Reminder } from '@/types/reminder';
import { titlesMatch } from '@/types/reminder';
import type { PackingItem } from '@/types/trip';

export type EvaluateRemindersInput = {
  context: AppContext;
  reminders: Reminder[];
  personalNecessities: PersonalNecessity[];
  packingItems: PackingItem[];
  routinesEnabled: boolean;
  preferContextual: boolean;
};

function hrefFor(item: RankedReminder): string {
  if (item.source === 'trip' || item.href.startsWith('/trip/')) return item.href;
  return item.href;
}

function placeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function placesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = placeKey(a);
  const right = placeKey(b);
  return left.length > 0 && left === right;
}

function isOpenReminder(item: Reminder): boolean {
  return item.status === 'open';
}

function pushUnique(out: RankedReminder[], next: RankedReminder): void {
  const existing = out.find((item) => titlesMatch(item.title, next.title));
  if (!existing) {
    out.push(next);
    return;
  }
  if (next.priority < existing.priority) {
    existing.id = next.id;
    existing.reason = next.reason;
    existing.priority = next.priority;
    existing.source = next.source;
    existing.href = next.href;
  }
}

function alwaysReminders(reminders: Reminder[]): Reminder[] {
  return reminders.filter(
    (item) =>
      isOpenReminder(item) &&
      item.category === 'specific' &&
      !item.location?.placeName &&
      !item.contextId,
  );
}

export function evaluateReminders(input: EvaluateRemindersInput): RankedReminder[] {
  const { context, reminders, personalNecessities, packingItems, routinesEnabled, preferContextual } =
    input;
  const out: RankedReminder[] = [];
  const open = reminders.filter(isOpenReminder);
  const routinesOn = routineMatchesContext(routinesEnabled, context.kind);

  const add = (
    id: string,
    title: string,
    reason: string,
    priority: ReminderPriority,
    source: RankedReminder['source'],
    href: string,
  ) => {
    pushUnique(out, { id, title, reason, priority, source, href: hrefFor({ id, title, reason, priority, source, href }) });
  };

  if (context.kind === 'leavingHome') {
    for (const item of open) {
      if (item.category !== 'beforeUgo') continue;
      if (context.departureId && item.contextId && item.contextId !== context.departureId) continue;
      if (context.departureId && !item.contextId) continue;
      add(item.id, item.title, 'before you go', 1, 'exact', '/before-ugo');
    }

    if (routinesOn) {
      for (const necessity of personalNecessities) {
        add(necessity.id, necessity.title, 'you usually take this', 3, 'routine', '/before-ugo');
      }
    }
  }

  if (context.kind === 'onTheWayBack') {
    for (const item of open) {
      if (item.category !== 'onTheWayBack') continue;
      const place = item.location?.placeName;
      if (context.placeName && place && !placesMatch(place, context.placeName)) continue;
      const exactPlace = Boolean(context.placeName && place && placesMatch(place, context.placeName));
      add(
        item.id,
        item.title,
        exactPlace ? `near ${place}` : 'along your way',
        exactPlace ? 1 : 2,
        exactPlace ? 'exact' : 'place',
        '/on-the-way-back',
      );
    }

    if (routinesOn) {
      for (const item of open) {
        if (item.category !== 'onTheWayBack') continue;
        add(item.id, item.title, 'coming back', 3, 'routine', '/on-the-way-back');
      }
    }
  }

  if (context.kind === 'specificPlace') {
    for (const item of open) {
      const place = item.location?.placeName;
      if (!place || !placesMatch(place, context.placeName)) continue;
      add(
        item.id,
        item.title,
        `near ${place}`,
        1,
        'exact',
        item.category === 'onTheWayBack' ? '/on-the-way-back' : '/(tabs)',
      );
    }
  }

  if (context.kind === 'trip' && context.tripId) {
    const tripId = context.tripId;
    for (const item of packingOpenForTrip(packingItems, tripId)) {
      add(item.id, item.title, 'for this trip', 1, 'exact', `/trip/${tripId}/packing`);
    }
    for (const item of open) {
      if (item.contextId !== tripId) continue;
      add(item.id, item.title, 'for this trip', 2, 'trip', `/trip/${tripId}`);
    }
    if (routinesOn) {
      const packed = packedTitlesForTrip(packingItems, tripId);
      for (const necessity of personalNecessities) {
        if (!necessityOpenForTrip(necessity, packed)) continue;
        add(necessity.id, necessity.title, 'you usually take this', 3, 'routine', `/trip/${tripId}/packing`);
      }
    }
  }

  if (context.kind === 'always') {
    for (const item of alwaysReminders(open)) {
      add(item.id, item.title, 'keep in mind', 4, 'always', '/(tabs)');
    }
  } else if (preferContextual) {
    for (const item of alwaysReminders(open)) {
      add(item.id, item.title, 'keep in mind', 4, 'always', '/(tabs)');
    }
  }

  return out.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
}
