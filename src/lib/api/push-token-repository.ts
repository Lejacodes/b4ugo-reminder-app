import { getSupabase, isSupabaseConfigured, requireSessionUserId } from '@/lib/supabase/client';
import { installationId } from '@/lib/notifications/installation';
import { preferencesStorage } from '@/lib/storage/preferences-storage';

export const pushTokenRepository = {
  async upsertToken(expoPushToken: string, platform: 'ios' | 'android', expectedUserId?: string, mode?: 'local' | 'remote'): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    if (expectedUserId && expectedUserId !== userId) throw new Error('Push account changed');
    const installation = await installationId();
    const deliveryMode = mode ?? (await preferencesStorage.getItem(`blugo.deliveryMode.${userId}`) === 'remote' ? 'remote' : 'local');
    // The old unique(user, token) row has no installation ID. Replace only the
    // exact token obtained for this device; other installations stay untouched.
    const { error: legacyError } = await supabase.from('push_tokens').delete()
      .eq('user_id', userId).eq('expo_push_token', expoPushToken).is('installation_id', null);
    if (legacyError) throw legacyError;
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        platform,
        installation_id: installation,
        delivery_mode: deliveryMode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,installation_id' },
    );
    if (error) throw error;
  },

  async removeCurrentInstallation(expectedUserId?: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const userId = await requireSessionUserId();
    if (expectedUserId && userId !== expectedUserId) throw new Error('Outgoing push account is no longer authenticated');
    const installation = await installationId();
    const { error } = await supabase.from('push_tokens').delete().eq('user_id', userId).eq('installation_id', installation);
    if (error) {
      console.warn('[blugo] push token remove failed', error.message);
      throw error;
    }
  },
};
