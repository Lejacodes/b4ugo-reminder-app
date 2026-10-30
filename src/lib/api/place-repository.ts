import { requireSessionUserId } from '@/lib/supabase/client';
import { loadPlaces, savePlaces } from '@/lib/places/place-store';
import type { Place } from '@/types/place';

export const placeRepository = {
  listPlaces: async () => loadPlaces(await requireSessionUserId()),
  async upsertPlace(place: Place) {
    const userId = await requireSessionUserId();
    const before = await loadPlaces(userId);
    const after = [...before.filter((item) => item.id !== place.id), place];
    await savePlaces(userId, after, before);
  },
  async deletePlace(id: string) {
    const userId = await requireSessionUserId();
    const before = await loadPlaces(userId);
    await savePlaces(userId, before.filter((place) => place.id !== id), before);
  },
};
