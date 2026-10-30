import { requireSessionUserId } from '@/lib/supabase/client';
import { readSingleton, writeSingleton } from '@/lib/sync/local';
import type { UserPreferences } from '@/types/preferences';
import type { UserProfile } from '@/types/user';

export const profileRepository = {
  getProfile: async () => readSingleton<UserProfile>(await requireSessionUserId(), 'profile'),
  getPreferences: async () => readSingleton<UserPreferences>(await requireSessionUserId(), 'preferences'),
  upsertProfile: async (value: UserProfile) => writeSingleton(await requireSessionUserId(), 'profile', value),
  upsertPreferences: async (value: UserPreferences) => writeSingleton(await requireSessionUserId(), 'preferences', value),
};
