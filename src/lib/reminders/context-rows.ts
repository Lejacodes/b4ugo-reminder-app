import type { Reminder } from '@/types/reminder';

/** Old setGoingTo copies of PersonalNecessity, tagged with a departure. */
export function isClonedNecessityRow(item: Reminder): boolean {
  return item.category === 'beforeUgo' && item.layer === 'always' && item.contextId != null;
}

export function stripClonedNecessityRows(reminders: Reminder[]): Reminder[] {
  return reminders.filter((item) => !isClonedNecessityRow(item));
}

export function dropContextRows(reminders: Reminder[], contextId: string | null | undefined): Reminder[] {
  if (!contextId) return reminders;
  return reminders.filter((item) => item.contextId !== contextId);
}

/** Drop cloned always-rows and every reminder belonging to a departure. */
export function dropDepartureRows(reminders: Reminder[], contextId: string | null | undefined): Reminder[] {
  return stripClonedNecessityRows(dropContextRows(reminders, contextId));
}
