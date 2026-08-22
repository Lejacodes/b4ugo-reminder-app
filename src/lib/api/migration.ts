import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { UserPreferences } from '@/types/preferences';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';
import type { PackingItem, PackingTemplate, TravelIntention, Trip } from '@/types/trip';
import type { UserProfile } from '@/types/user';

import { profileRepository } from './profile-repository';
import { reminderRepository } from './reminder-repository';
import { tripRepository } from './trip-repository';

const SNAPSHOT_KEY = 'blugo.device.snapshot';

export type LocalSnapshot = {
  email?: string | null;
  profile?: UserProfile | null;
  preferences?: UserPreferences | null;
  reminders?: Reminder[];
  necessities?: PersonalNecessity[];
  context?: BeforeUgoContext | null;
  trips?: Trip[];
  packingItems?: PackingItem[];
  packingTemplates?: PackingTemplate[];
  travelIntentions?: TravelIntention[];
};

function migratedKey(userId: string): string {
  return `blugo.migrated.${userId}`;
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await preferencesStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadScopedSnapshot(userId: string): Promise<LocalSnapshot> {
  const [
    profile,
    preferences,
    reminders,
    necessities,
    context,
    trips,
    packingItems,
    packingTemplates,
    travelIntentions,
  ] = await Promise.all([
    readJson<UserProfile>(scopedKey(STORAGE_KEYS.profile, userId)),
    readJson<UserPreferences>(scopedKey(STORAGE_KEYS.preferences, userId)),
    readJson<Reminder[]>(scopedKey(STORAGE_KEYS.reminders, userId)),
    readJson<PersonalNecessity[]>(scopedKey(STORAGE_KEYS.necessities, userId)),
    readJson<BeforeUgoContext>(scopedKey(STORAGE_KEYS.context, userId)),
    readJson<Trip[]>(scopedKey(STORAGE_KEYS.trips, userId)),
    readJson<PackingItem[]>(scopedKey(STORAGE_KEYS.packingItems, userId)),
    readJson<PackingTemplate[]>(scopedKey(STORAGE_KEYS.packingTemplates, userId)),
    readJson<TravelIntention[]>(scopedKey(STORAGE_KEYS.travelIntentions, userId)),
  ]);

  return {
    profile,
    preferences,
    reminders: reminders ?? [],
    necessities: necessities ?? [],
    context,
    trips: trips ?? [],
    packingItems: packingItems ?? [],
    packingTemplates: packingTemplates ?? [],
    travelIntentions: travelIntentions ?? [],
  };
}

function snapshotHasData(snapshot: LocalSnapshot): boolean {
  return Boolean(
    snapshot.profile?.displayName ||
      snapshot.preferences?.hasCompletedOnboarding ||
      (snapshot.reminders?.length ?? 0) > 0 ||
      (snapshot.necessities?.length ?? 0) > 0 ||
      snapshot.context ||
      (snapshot.trips?.length ?? 0) > 0 ||
      (snapshot.packingItems?.length ?? 0) > 0 ||
      (snapshot.packingTemplates?.length ?? 0) > 0 ||
      (snapshot.travelIntentions?.length ?? 0) > 0,
  );
}

export async function writeDeviceSnapshot(
  email: string | null | undefined,
  snapshot: LocalSnapshot,
): Promise<void> {
  try {
    await preferencesStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({
        ...snapshot,
        email: email ?? snapshot.email ?? null,
      }),
    );
  } catch {
    // Best-effort only.
  }
}

let inflight: Promise<void> | null = null;

async function migrate(userId: string, email?: string | null): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const already = await preferencesStorage.getItem(migratedKey(userId));
  if (already === '1') return;

  const [remoteNecessities, remoteReminders, remoteTrips] = await Promise.all([
    reminderRepository.listNecessities(),
    reminderRepository.listReminders(),
    tripRepository.listTrips(),
  ]);

  const remoteAlreadyHasData = Boolean(
    (remoteNecessities && remoteNecessities.length > 0) ||
      (remoteReminders && remoteReminders.length > 0) ||
      (remoteTrips && remoteTrips.length > 0),
  );

  if (remoteAlreadyHasData) {
    await preferencesStorage.setItem(migratedKey(userId), '1');
    return;
  }

  let local = await loadScopedSnapshot(userId);
  if (!snapshotHasData(local)) {
    const device = await readJson<LocalSnapshot>(SNAPSHOT_KEY);
    if (device && (!device.email || !email || device.email === email)) {
      local = { ...local, ...device };
    }
  }

  if (!snapshotHasData(local)) {
    await preferencesStorage.setItem(migratedKey(userId), '1');
    return;
  }

  if (local.profile) await profileRepository.upsertProfile({ ...local.profile, userId });
  if (local.preferences) await profileRepository.upsertPreferences(local.preferences);
  if (local.necessities?.length) await reminderRepository.replaceNecessities(local.necessities);
  if (local.context) await reminderRepository.saveActiveDeparture(local.context);
  if (local.reminders?.length) await reminderRepository.replaceReminders(local.reminders);
  if (local.trips?.length) await tripRepository.replaceTrips(local.trips);
  if (local.packingItems?.length) await tripRepository.replacePackingItems(local.packingItems);
  if (local.packingTemplates?.length) await tripRepository.replaceTemplates(local.packingTemplates);
  if (local.travelIntentions?.length) await tripRepository.replaceIntentions(local.travelIntentions);

  await preferencesStorage.setItem(migratedKey(userId), '1');
}

export function ensureMigrated(userId: string, email?: string | null): Promise<void> {
  if (!inflight) {
    inflight = migrate(userId, email).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
