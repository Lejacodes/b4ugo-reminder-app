import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';
import { defaultUserPreferences, type UserPreferences } from '@/types/preferences';
import { defaultUserProfile, type UserProfile } from '@/types/user';
import type { OnboardingInterest } from '@/types/onboarding';

type ProfileRow = {
  id: string;
  display_name: string | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
};

type PreferenceRow = {
  user_id: string;
  theme: 'light' | 'dark';
  context_aware: boolean;
  routines_enabled: boolean;
  ai_parsing_enabled: boolean;
  location_reminders_enabled: boolean;
  push_enabled: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
};

function toProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.id,
    displayName: row.display_name,
    interests: (row.interests ?? []) as OnboardingInterest[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPreferences(row: PreferenceRow): UserPreferences {
  const base = defaultUserPreferences();
  return {
    ...base,
    appearance: row.theme === 'dark' ? 'dark' : 'light',
    hasCompletedOnboarding: row.has_completed_onboarding,
    reminders: {
      ...base.reminders,
      preferContextual: row.context_aware,
      routineRemindersEnabled: row.routines_enabled,
      locationRemindersEnabled: row.location_reminders_enabled,
    },
    privacy: {
      ...base.privacy,
      aiParsingEnabled: row.ai_parsing_enabled,
    },
    notifications: {
      ...base.notifications,
      pushEnabled: row.push_enabled,
    },
  };
}

export const profileRepository = {
  async getProfile(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.warn('[blugo] profile load failed', error.message);
        return null;
      }
      return data ? toProfile(data as ProfileRow) : defaultUserProfile(userId);
    } catch (error) {
      console.warn('[blugo] profile load failed', error);
      return null;
    }
  },

  async upsertProfile(profile: UserProfile): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: profile.displayName,
      interests: profile.interests,
      updated_at: profile.updatedAt,
    });
    if (error) console.warn('[blugo] profile save failed', error.message);
  },

  async getPreferences(): Promise<UserPreferences | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const userId = await requireSessionUserId();
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.warn('[blugo] preferences load failed', error.message);
        return null;
      }
      return data ? toPreferences(data as PreferenceRow) : defaultUserPreferences();
    } catch (error) {
      console.warn('[blugo] preferences load failed', error);
      return null;
    }
  },

  async upsertPreferences(preferences: UserPreferences): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: userId,
      theme: preferences.appearance === 'dark' ? 'dark' : 'light',
      context_aware: preferences.reminders.preferContextual,
      routines_enabled: preferences.reminders.routineRemindersEnabled,
      ai_parsing_enabled: preferences.privacy.aiParsingEnabled,
      location_reminders_enabled: preferences.reminders.locationRemindersEnabled,
      push_enabled: preferences.notifications.pushEnabled,
      has_completed_onboarding: preferences.hasCompletedOnboarding,
    });
    if (error) console.warn('[blugo] preferences save failed', error.message);
  },
};
