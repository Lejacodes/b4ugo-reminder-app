import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';
import type { Place, SavedPlaceType } from '@/types/place';

type PlaceRow = {
  id: string;
  title: string;
  type: string;
  notes: string | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

function toPlace(row: PlaceRow): Place {
  const type = (['home', 'place', 'work', 'other'] as const).includes(row.type as SavedPlaceType)
    ? (row.type as SavedPlaceType)
    : 'place';
  return {
    id: row.id,
    name: row.place_name || row.title,
    label: row.notes,
    type,
    latitude: row.latitude,
    longitude: row.longitude,
    isActive: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromPlace(userId: string, place: Place) {
  return {
    id: place.id,
    user_id: userId,
    trip_id: null,
    title: place.name,
    type: place.type,
    notes: place.label,
    place_name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    created_at: place.createdAt,
    updated_at: place.updatedAt,
  };
}

export const placeRepository = {
  async listPlaces(): Promise<Place[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase
        .from('saved_places_or_intentions')
        .select('*')
        .eq('user_id', userId)
        .is('trip_id', null);
      if (error) {
        console.warn('[blugo] places load failed', error.message);
        return null;
      }
      return (data as PlaceRow[]).map(toPlace);
    } catch (error) {
      console.warn('[blugo] places load failed', error);
      return null;
    }
  },

  async upsertPlace(place: Place): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase.from('saved_places_or_intentions').upsert(fromPlace(userId, place));
    if (error) console.warn('[blugo] place save failed', error.message);
  },

  async deletePlace(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase
      .from('saved_places_or_intentions')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .is('trip_id', null);
    if (error) console.warn('[blugo] place delete failed', error.message);
  },
};
