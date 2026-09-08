/**
 * Persistence for reminders and the current Before U Go context.
 * Local keystore is the cache. Supabase is the source of truth when configured.
 */
import { ensureMigrated } from '@/lib/api/migration';
import { reminderRepository } from '@/lib/api/reminder-repository';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';

async function readList<T>(key: string): Promise<T[]> {
  const raw = await preferencesStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadReminders(userId: string): Promise<Reminder[]> {
  const local = await readList<Reminder>(scopedKey(STORAGE_KEYS.reminders, userId));
  if (!isSupabaseConfigured()) return local;
  try {
    await ensureMigrated(userId);
    const remote = await reminderRepository.listReminders();
    if (!remote) return local;
    await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.reminders, userId), JSON.stringify(remote));
    return remote;
  } catch {
    return local;
  }
}

export async function saveReminders(userId: string, reminders: Reminder[]): Promise<void> {
  await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.reminders, userId), JSON.stringify(reminders));
  if (!isSupabaseConfigured()) return;
  try {
    await reminderRepository.replaceReminders(reminders);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}

export async function loadNecessities(userId: string): Promise<PersonalNecessity[]> {
  const local = await readList<PersonalNecessity>(scopedKey(STORAGE_KEYS.necessities, userId));
  if (!isSupabaseConfigured()) return local;
  try {
    await ensureMigrated(userId);
    const remote = await reminderRepository.listNecessities();
    if (!remote) return local;
    const localById = new Map(local.map((item) => [item.id, item]));
    const merged = remote.map((item) => ({
      ...item,
      activeDays: localById.get(item.id)?.activeDays ?? item.activeDays,
    }));
    await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.necessities, userId), JSON.stringify(merged));
    return merged;
  } catch {
    return local;
  }
}

export async function saveNecessities(
  userId: string,
  necessities: PersonalNecessity[],
): Promise<void> {
  await preferencesStorage.setItem(
    scopedKey(STORAGE_KEYS.necessities, userId),
    JSON.stringify(necessities),
  );
  if (!isSupabaseConfigured()) return;
  try {
    await reminderRepository.replaceNecessities(necessities);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}

export async function loadContext(userId: string): Promise<BeforeUgoContext | null> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.context, userId));
  let local: BeforeUgoContext | null = null;
  if (raw) {
    try {
      local = JSON.parse(raw) as BeforeUgoContext;
    } catch {
      local = null;
    }
  }
  if (!isSupabaseConfigured()) return local;
  try {
    await ensureMigrated(userId);
    const remote = await reminderRepository.getActiveDeparture();
    if (remote) {
      await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.context, userId), JSON.stringify(remote));
      return remote;
    }
    return local;
  } catch {
    return local;
  }
}

export async function saveContext(userId: string, context: BeforeUgoContext | null): Promise<void> {
  const key = scopedKey(STORAGE_KEYS.context, userId);
  if (!context) {
    await preferencesStorage.removeItem(key);
  } else {
    await preferencesStorage.setItem(key, JSON.stringify(context));
  }
  if (!isSupabaseConfigured()) return;
  try {
    await reminderRepository.saveActiveDeparture(context);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}
