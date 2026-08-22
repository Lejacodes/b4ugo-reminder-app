import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';
import type {
  PackingItem,
  PackingTemplate,
  PackingTemplateItem,
  TravelIntention,
  Trip,
  TripStatus,
} from '@/types/trip';

type TripRow = {
  id: string;
  title: string | null;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  country: string | null;
  region: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  season: string | null;
  activity: string | null;
  accommodation: string | null;
  transportation: string | null;
  notes: string | null;
  status: TripStatus;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  trip_id: string;
  title: string;
  category: PackingItem['category'];
  source: PackingItem['source'];
  status: string;
  reason: string | null;
  dismissed: boolean;
  created_at: string;
  updated_at: string;
};

type TemplateRow = {
  id: string;
  name: string;
  activity: string | null;
  items: PackingTemplateItem[];
  created_at: string;
  updated_at: string;
};

type IntentionRow = {
  id: string;
  trip_id: string | null;
  title: string;
  type: TravelIntention['type'];
  notes: string | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    title: row.title || row.destination,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration,
    activity: row.activity,
    season: row.season,
    accommodation: row.accommodation,
    transportation: row.transportation,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    country: row.country,
    region: row.region,
  };
}

function fromTrip(userId: string, trip: Trip) {
  return {
    id: trip.id,
    user_id: userId,
    kind: 'trip',
    title: trip.title,
    destination: trip.destination,
    latitude: trip.latitude ?? null,
    longitude: trip.longitude ?? null,
    timezone: trip.timezone ?? null,
    country: trip.country ?? null,
    region: trip.region ?? null,
    start_date: trip.startDate,
    end_date: trip.endDate,
    duration: trip.durationDays,
    season: trip.season,
    activity: trip.activity,
    accommodation: trip.accommodation,
    transportation: trip.transportation,
    notes: trip.notes,
    status: trip.status,
    is_active: trip.status === 'active',
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
}

function toPacking(row: ItemRow): PackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    category: row.category,
    checked: row.status === 'done',
    source: row.source,
    reason: row.reason,
    dismissed: row.dismissed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromPacking(userId: string, item: PackingItem) {
  return {
    id: item.id,
    trip_id: item.tripId,
    user_id: userId,
    title: item.title,
    category: item.category,
    source: item.source,
    status: item.checked ? 'done' : 'open',
    reason: item.reason,
    dismissed: item.dismissed,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

async function replaceUserRows(table: string, rows: Record<string, unknown>[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = await requireSessionUserId();
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('user_id', userId);
  if (readError) {
    console.warn('[blugo] trip replace read failed', table, readError.message);
    return;
  }
  const keep = new Set(rows.map((row) => String(row.id)));
  const remove = (existing ?? []).map((row) => row.id as string).filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', remove);
    if (error) console.warn('[blugo] trip replace delete failed', table, error.message);
  }
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) console.warn('[blugo] trip replace upsert failed', table, error.message);
  }
}

export const tripRepository = {
  async listTrips(): Promise<Trip[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase
        .from('trip_contexts')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', 'trip');
      if (error) {
        console.warn('[blugo] trips load failed', error.message);
        return null;
      }
      return (data as TripRow[]).map(toTrip);
    } catch (error) {
      console.warn('[blugo] trips load failed', error);
      return null;
    }
  },

  async replaceTrips(trips: Trip[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const userId = await requireSessionUserId();
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: existing, error } = await supabase
      .from('trip_contexts')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', 'trip');
    if (error) {
      console.warn('[blugo] trips replace read failed', error.message);
      return;
    }
    const keep = new Set(trips.map((trip) => trip.id));
    const remove = (existing ?? []).map((row) => row.id as string).filter((id) => !keep.has(id));
    if (remove.length > 0) {
      await supabase.from('trip_contexts').delete().eq('user_id', userId).eq('kind', 'trip').in('id', remove);
    }
    if (trips.length > 0) {
      const { error: upsertError } = await supabase.from('trip_contexts').upsert(trips.map((trip) => fromTrip(userId, trip)));
      if (upsertError) console.warn('[blugo] trips save failed', upsertError.message);
    }
  },

  async listPackingItems(): Promise<PackingItem[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase.from('trip_items').select('*').eq('user_id', userId);
      if (error) {
        console.warn('[blugo] packing load failed', error.message);
        return null;
      }
      return (data as ItemRow[]).map(toPacking);
    } catch (error) {
      console.warn('[blugo] packing load failed', error);
      return null;
    }
  },

  async replacePackingItems(items: PackingItem[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const userId = await requireSessionUserId();
    await replaceUserRows(
      'trip_items',
      items.map((item) => fromPacking(userId, item)),
    );
  },

  async listTemplates(): Promise<PackingTemplate[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase.from('packing_templates').select('*').eq('user_id', userId);
      if (error) {
        console.warn('[blugo] templates load failed', error.message);
        return null;
      }
      return (data as TemplateRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        items: Array.isArray(row.items) ? row.items : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.warn('[blugo] templates load failed', error);
      return null;
    }
  },

  async replaceTemplates(templates: PackingTemplate[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const userId = await requireSessionUserId();
    await replaceUserRows(
      'packing_templates',
      templates.map((template) => ({
        id: template.id,
        user_id: userId,
        name: template.name,
        activity: null,
        items: template.items,
        created_at: template.createdAt,
        updated_at: template.updatedAt,
      })),
    );
  },

  async listIntentions(): Promise<TravelIntention[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase
        .from('saved_places_or_intentions')
        .select('*')
        .eq('user_id', userId);
      if (error) {
        console.warn('[blugo] intentions load failed', error.message);
        return null;
      }
      return (data as IntentionRow[])
        .filter((row) => row.trip_id)
        .map((row) => ({
          id: row.id,
          tripId: row.trip_id as string,
          title: row.title,
          type: row.type,
          placeName: row.place_name,
          latitude: row.latitude,
          longitude: row.longitude,
          note: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
    } catch (error) {
      console.warn('[blugo] intentions load failed', error);
      return null;
    }
  },

  async replaceIntentions(intentions: TravelIntention[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { data: existing, error } = await supabase
      .from('saved_places_or_intentions')
      .select('id')
      .eq('user_id', userId)
      .not('trip_id', 'is', null);
    if (error) {
      console.warn('[blugo] intentions replace read failed', error.message);
      return;
    }
    const keep = new Set(intentions.map((item) => item.id));
    const remove = (existing ?? []).map((row) => row.id as string).filter((id) => !keep.has(id));
    if (remove.length > 0) {
      const { error: deleteError } = await supabase
        .from('saved_places_or_intentions')
        .delete()
        .eq('user_id', userId)
        .not('trip_id', 'is', null)
        .in('id', remove);
      if (deleteError) console.warn('[blugo] intentions delete failed', deleteError.message);
    }
    if (intentions.length === 0) return;
    const { error: upsertError } = await supabase.from('saved_places_or_intentions').upsert(
      intentions.map((item) => ({
        id: item.id,
        user_id: userId,
        trip_id: item.tripId,
        title: item.title,
        type: item.type,
        notes: item.note,
        place_name: item.placeName,
        latitude: item.latitude,
        longitude: item.longitude,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
    if (upsertError) console.warn('[blugo] intentions save failed', upsertError.message);
  },
};
