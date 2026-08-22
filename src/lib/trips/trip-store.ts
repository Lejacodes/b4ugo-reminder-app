/**
 * Persistence for trips, packing lists, templates, and travel intentions.
 * Local keystore is the cache. Supabase is the source of truth when configured.
 */
import { ensureMigrated } from '@/lib/api/migration';
import { tripRepository } from '@/lib/api/trip-repository';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { PackingItem, PackingTemplate, TravelIntention, Trip } from '@/types/trip';

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

async function writeList<T>(key: string, value: T[]): Promise<void> {
  await preferencesStorage.setItem(key, JSON.stringify(value));
}

async function loadRemoteOrLocal<T>(
  userId: string,
  localKey: string,
  remote: () => Promise<T[] | null>,
): Promise<T[]> {
  const local = await readList<T>(localKey);
  if (!isSupabaseConfigured()) return local;
  try {
    await ensureMigrated(userId);
    const next = await remote();
    if (!next) return local;
    await writeList(localKey, next);
    return next;
  } catch {
    return local;
  }
}

export async function loadTrips(userId: string): Promise<Trip[]> {
  return loadRemoteOrLocal(userId, scopedKey(STORAGE_KEYS.trips, userId), () => tripRepository.listTrips());
}

export async function saveTrips(userId: string, trips: Trip[]): Promise<void> {
  await writeList(scopedKey(STORAGE_KEYS.trips, userId), trips);
  if (!isSupabaseConfigured()) return;
  try {
    await tripRepository.replaceTrips(trips);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}

export async function loadPackingItems(userId: string): Promise<PackingItem[]> {
  return loadRemoteOrLocal(userId, scopedKey(STORAGE_KEYS.packingItems, userId), () =>
    tripRepository.listPackingItems(),
  );
}

export async function savePackingItems(userId: string, items: PackingItem[]): Promise<void> {
  await writeList(scopedKey(STORAGE_KEYS.packingItems, userId), items);
  if (!isSupabaseConfigured()) return;
  try {
    await tripRepository.replacePackingItems(items);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}

export async function loadPackingTemplates(userId: string): Promise<PackingTemplate[]> {
  return loadRemoteOrLocal(userId, scopedKey(STORAGE_KEYS.packingTemplates, userId), () =>
    tripRepository.listTemplates(),
  );
}

export async function savePackingTemplates(
  userId: string,
  templates: PackingTemplate[],
): Promise<void> {
  await writeList(scopedKey(STORAGE_KEYS.packingTemplates, userId), templates);
  if (!isSupabaseConfigured()) return;
  try {
    await tripRepository.replaceTemplates(templates);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}

export async function loadTravelIntentions(userId: string): Promise<TravelIntention[]> {
  return loadRemoteOrLocal(userId, scopedKey(STORAGE_KEYS.travelIntentions, userId), () =>
    tripRepository.listIntentions(),
  );
}

export async function saveTravelIntentions(
  userId: string,
  intentions: TravelIntention[],
): Promise<void> {
  await writeList(scopedKey(STORAGE_KEYS.travelIntentions, userId), intentions);
  if (!isSupabaseConfigured()) return;
  try {
    await tripRepository.replaceIntentions(intentions);
  } catch {
    // Keep the local cache if the remote write fails.
  }
}
