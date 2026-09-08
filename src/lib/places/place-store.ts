import { placeRepository } from '@/lib/api/place-repository';
import { STORAGE_KEYS, preferencesStorage, scopedKey } from '@/lib/storage/preferences-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { Place } from '@/types/place';

export async function loadPlaces(userId: string): Promise<Place[]> {
  const raw = await preferencesStorage.getItem(scopedKey(STORAGE_KEYS.savedPlaces, userId));
  let local: Place[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Place[];
      local = Array.isArray(parsed) ? parsed : [];
    } catch {
      local = [];
    }
  }
  if (!isSupabaseConfigured()) return local;
  try {
    const remote = await placeRepository.listPlaces();
    if (!remote) return local;
    await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.savedPlaces, userId), JSON.stringify(remote));
    return remote;
  } catch {
    return local;
  }
}

export async function savePlaces(userId: string, places: Place[]): Promise<void> {
  await preferencesStorage.setItem(scopedKey(STORAGE_KEYS.savedPlaces, userId), JSON.stringify(places));
  if (!isSupabaseConfigured()) return;
  try {
    const remote = (await placeRepository.listPlaces()) ?? [];
    const keep = new Set(places.map((place) => place.id));
    for (const existing of remote) {
      if (!keep.has(existing.id)) {
        await placeRepository.deletePlace(existing.id);
      }
    }
    for (const place of places) {
      await placeRepository.upsertPlace(place);
    }
  } catch {
    // Keep the local cache if the remote write fails.
  }
}
