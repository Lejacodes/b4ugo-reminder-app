/**
 * Browser/device Supabase client.
 *
 * Only the project URL and publishable (anon) key are used here.
 * The service-role key must never enter this module.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { authProviderConfig, isProviderConfigured, authProviderId } from '@/lib/auth/config';
import { sessionStorageAdapter } from '@/lib/auth/session-store';

const CHUNK = 1600;

/**
 * SecureStore historically rejects large strings. Supabase session JSON
 * is chunked so restore still works on iOS/Android.
 */
const chunkedStorage = {
  async getItem(key: string): Promise<string | null> {
    const meta = await sessionStorageAdapter.getItem(key);
    if (!meta) return null;
    if (!meta.startsWith('chunks:')) return meta;
    const count = Number(meta.slice('chunks:'.length));
    if (!Number.isFinite(count) || count < 1) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await sessionStorageAdapter.getItem(`${key}.${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await chunkedStorage.removeItem(key);
    if (value.length <= CHUNK) {
      await sessionStorageAdapter.setItem(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK);
    await sessionStorageAdapter.setItem(key, `chunks:${count}`);
    for (let i = 0; i < count; i += 1) {
      await sessionStorageAdapter.setItem(key + '.' + i, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },
  async removeItem(key: string): Promise<void> {
    const meta = await sessionStorageAdapter.getItem(key);
    const count = meta?.startsWith('chunks:') ? Number(meta.slice('chunks:'.length)) : 0;
    await sessionStorageAdapter.removeItem(key);
    const extra = Number.isFinite(count) ? count : 8;
    for (let i = 0; i < extra; i += 1) {
      await sessionStorageAdapter.removeItem(`${key}.${i}`);
    }
  },
};

export function isSupabaseConfigured(): boolean {
  return (
    authProviderId === 'supabase' &&
    Boolean(authProviderConfig.supabase.url && authProviderConfig.supabase.anonKey)
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;

  const url = authProviderConfig.supabase.url;
  const anonKey = authProviderConfig.supabase.anonKey;
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey, {
    auth: {
      storage: chunkedStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export async function requireSessionUserId(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('supabase-not-configured');
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('unauthorized');
  }
  return data.user.id;
}

export { isProviderConfigured };
