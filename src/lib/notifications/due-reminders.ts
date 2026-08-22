import type { Reminder } from '@/types/reminder';

import { dueNotificationId, hrefForDueReminder, isDueNotificationId } from './routing';

export type DueReminderAction =
  | {
      type: 'schedule';
      id: string;
      reminderId: string;
      title: string;
      body: string;
      href: string;
      at: Date;
    }
  | { type: 'cancel'; id: string };

function futureDueAt(value: string | null | undefined, now: number): Date | null {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime()) || at.getTime() <= now) return null;
  return at;
}

export function planDueReminderActions(
  reminders: Reminder[],
  scheduledIds: string[],
  now = Date.now(),
): DueReminderAction[] {
  const keep = new Map<string, Reminder>();
  for (const item of reminders) {
    if (item.status !== 'open') continue;
    if (!futureDueAt(item.dueAt, now)) continue;
    keep.set(dueNotificationId(item.id, item.dueAt), item);
  }

  const actions: DueReminderAction[] = [];
  const scheduled = new Set(scheduledIds);

  for (const id of scheduledIds) {
    if (isDueNotificationId(id) && !keep.has(id)) {
      actions.push({ type: 'cancel', id });
    }
  }

  for (const [id, item] of keep) {
    if (scheduled.has(id)) continue;
    const at = futureDueAt(item.dueAt, now);
    if (!at) continue;
    actions.push({
      type: 'schedule',
      id,
      reminderId: item.id,
      title: item.title,
      body: item.location?.placeName ?? item.reason ?? 'later',
      href: hrefForDueReminder(item),
      at,
    });
  }

  return actions;
}
