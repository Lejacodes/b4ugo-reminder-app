import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';
import type {
  BeforeUgoContext,
  BeforeUgoLayer,
  PersonalNecessity,
  Reminder,
  ReminderCategory,
  ReminderSource,
  ReminderStatus,
} from '@/types/reminder';

type ReminderRow = {
  id: string;
  title: string;
  type: ReminderCategory;
  status: ReminderStatus;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  context_id: string | null;
  layer: BeforeUgoLayer | null;
  reason: string | null;
  source: ReminderSource;
  person: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

type NecessityRow = {
  id: string;
  title: string;
  category: string;
  source: ReminderSource;
  created_at: string;
  updated_at: string;
};

type ContextRow = {
  id: string;
  destination: string;
  purpose: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  country: string | null;
  region: string | null;
  is_active: boolean;
  created_at: string;
};

function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    category: row.type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
    layer: row.layer,
    contextId: row.context_id,
    reason: row.reason,
    location: row.place_name
      ? {
          placeName: row.place_name,
          latitude: row.latitude,
          longitude: row.longitude,
          radiusMeters: null,
        }
      : null,
    person: row.person,
    dueAt: row.due_at,
  };
}

function fromReminder(userId: string, item: Reminder) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    type: item.category,
    status: item.status,
    place_name: item.location?.placeName ?? null,
    latitude: item.location?.latitude ?? null,
    longitude: item.location?.longitude ?? null,
    context_id: item.contextId,
    layer: item.layer,
    reason: item.reason,
    source: item.source,
    person: item.person,
    due_at: item.dueAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function toNecessity(row: NecessityRow): PersonalNecessity {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    createdAt: row.created_at,
  };
}

function fromNecessity(userId: string, item: PersonalNecessity) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    category: 'essentials',
    source: item.source,
    created_at: item.createdAt,
    updated_at: item.createdAt,
  };
}

function toContext(row: ContextRow): BeforeUgoContext {
  return {
    id: row.id,
    destination: row.destination,
    purpose: row.purpose,
    person: null,
    dateTime: null,
    createdAt: row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    country: row.country,
    region: row.region,
  };
}

async function replaceCollection<T extends { id: string }>(
  table: string,
  rows: T[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = await requireSessionUserId();
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('user_id', userId);
  if (readError) {
    console.warn('[blugo] replace read failed', table, readError.message);
    return;
  }
  const keep = new Set(rows.map((row) => row.id));
  const remove = (existing ?? []).map((row) => row.id as string).filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', remove);
    if (error) console.warn('[blugo] replace delete failed', table, error.message);
  }
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) console.warn('[blugo] replace upsert failed', table, error.message);
  }
}

export const reminderRepository = {
  async listReminders(): Promise<Reminder[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId);
      if (error) {
        console.warn('[blugo] reminders load failed', error.message);
        return null;
      }
      return (data as ReminderRow[]).map(toReminder);
    } catch (error) {
      console.warn('[blugo] reminders load failed', error);
      return null;
    }
  },

  async replaceReminders(reminders: Reminder[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const contextIds = [
      ...new Set(reminders.map((item) => item.contextId).filter((id): id is string => Boolean(id))),
    ];
    if (contextIds.length > 0) {
      const stubs = contextIds.map((id) => ({
        id,
        user_id: userId,
        kind: 'departure',
        destination: 'saved',
        is_active: false,
        status: 'planned',
      }));
      const { error } = await supabase.from('trip_contexts').upsert(stubs, { ignoreDuplicates: true });
      if (error) console.warn('[blugo] context stub save failed', error.message);
    }
    await replaceCollection(
      'reminders',
      reminders.map((item) => fromReminder(userId, item)),
    );
  },

  async listNecessities(): Promise<PersonalNecessity[] | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase.from('personal_necessities').select('*').eq('user_id', userId);
      if (error) {
        console.warn('[blugo] necessities load failed', error.message);
        return null;
      }
      return (data as NecessityRow[]).map(toNecessity);
    } catch (error) {
      console.warn('[blugo] necessities load failed', error);
      return null;
    }
  },

  async replaceNecessities(necessities: PersonalNecessity[]): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const userId = await requireSessionUserId();
    await replaceCollection(
      'personal_necessities',
      necessities.map((item) => fromNecessity(userId, item)),
    );
  },

  async getActiveDeparture(): Promise<BeforeUgoContext | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase
        .from('trip_contexts')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', 'departure')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[blugo] context load failed', error.message);
        return null;
      }
      return data ? toContext(data as ContextRow) : null;
    } catch (error) {
      console.warn('[blugo] context load failed', error);
      return null;
    }
  },

  async saveActiveDeparture(context: BeforeUgoContext | null): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();

    await supabase
      .from('trip_contexts')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('kind', 'departure');

    if (!context) return;

    const { error } = await supabase.from('trip_contexts').upsert({
      id: context.id,
      user_id: userId,
      kind: 'departure',
      title: context.destination,
      destination: context.destination,
      purpose: context.purpose,
      latitude: context.latitude ?? null,
      longitude: context.longitude ?? null,
      timezone: context.timezone ?? null,
      country: context.country ?? null,
      region: context.region ?? null,
      status: 'active',
      is_active: true,
      created_at: context.createdAt,
    });
    if (error) console.warn('[blugo] context save failed', error.message);
  },
};
