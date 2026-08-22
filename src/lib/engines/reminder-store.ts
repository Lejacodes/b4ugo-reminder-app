/**
 * Persistence for reminders and the current Before U Go context.
 * Uses the same keystore-backed store as profile/preferences, scoped by user.
 */
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';

export async function loadReminders(userId: string): Promise<Reminder[]> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.reminders, userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReminders(userId: string, reminders: Reminder[]): Promise<void> {
  await preferencesStorage.setItem(
    scopedKey(STORAGE_KEYS.reminders, userId),
    JSON.stringify(reminders),
  );
}

export async function loadNecessities(userId: string): Promise<PersonalNecessity[]> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.necessities, userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PersonalNecessity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
}

export async function loadContext(userId: string): Promise<BeforeUgoContext | null> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.context, userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BeforeUgoContext;
  } catch {
    return null;
  }
}

export async function saveContext(userId: string, context: BeforeUgoContext | null): Promise<void> {
  const key = scopedKey(STORAGE_KEYS.context, userId);
  if (!context) {
    await preferencesStorage.removeItem(key);
    return;
  }
  await preferencesStorage.setItem(key, JSON.stringify(context));
}
