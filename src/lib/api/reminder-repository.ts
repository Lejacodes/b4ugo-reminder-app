import { requireSessionUserId } from '@/lib/supabase/client';
import { loadContext, loadNecessities, loadReminders, saveContext, saveNecessities, saveReminders } from '@/lib/engines/reminder-store';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';

/** Legacy facade: writes now produce local per-record operations, never server replacement. */
export const reminderRepository = {
  listReminders: async () => loadReminders(await requireSessionUserId()),
  listNecessities: async () => loadNecessities(await requireSessionUserId()),
  getActiveDeparture: async () => loadContext(await requireSessionUserId()),
  replaceReminders: async (records: Reminder[]) => saveReminders(await requireSessionUserId(), records),
  replaceNecessities: async (records: PersonalNecessity[]) => saveNecessities(await requireSessionUserId(), records),
  saveActiveDeparture: async (record: BeforeUgoContext | null) => saveContext(await requireSessionUserId(), record),
};
