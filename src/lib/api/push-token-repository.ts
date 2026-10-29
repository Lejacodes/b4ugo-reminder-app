import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';

export const pushTokenRepository = {
  async upsertToken(expoPushToken: string, platform: 'ios' | 'android'): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        platform,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,expo_push_token' },
    );
    if (error) console.warn('[blugo] push token save failed', error.message);
  },

  async removeAllForCurrentUser(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    const { error } = await supabase.from('push_tokens').delete().eq('user_id', userId);
    if (error) {
      console.warn('[blugo] push token remove failed', error.message);
      throw error;
    }
  },
};
