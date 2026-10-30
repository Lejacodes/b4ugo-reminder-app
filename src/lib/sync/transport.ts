import { getSupabase } from '@/lib/supabase/client';
import type { SyncRecord, SyncTransport } from './repository';

async function deadline<T>(task: (signal: AbortSignal) => PromiseLike<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try { return await task(controller.signal); }
  finally { clearTimeout(timer); }
}

async function accountClient(userId: string) {
  const client = getSupabase();
  if (!client) throw new Error('Sync is not configured');
  const { data, error } = await client.auth.getSession();
  // This check fences the client account. The RPC/RLS independently authorize
  // the signed JWT on the server; cached session data is never server authority.
  if (error || data.session?.user.id !== userId) throw new Error('Sync session changed');
  return client;
}

export const syncTransport: SyncTransport = {
  async apply(userId, operation) {
    const client = await accountClient(userId);
    const { data, error } = await deadline((signal) => client.rpc('apply_record_operation', {
      p_operation_id: operation.operationId,
      p_collection: operation.collection,
      p_record_id: operation.id,
      p_base_version: operation.baseVersion,
      p_payload: operation.value,
      p_deleted: operation.deleted,
    }).abortSignal(signal));
    if (error) throw error;
    return data as { record: SyncRecord; conflict: boolean };
  },
  async pull(userId) {
    const client = await accountClient(userId);
    const result: SyncRecord[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await deadline((signal) => client.from('domain_records').select('*').eq('user_id', userId)
        .order('collection').order('record_id').range(offset, offset + 499).abortSignal(signal));
      if (error) throw error;
      for (const row of data ?? []) result.push({ collection: row.collection, id: row.record_id,
        value: row.payload, version: row.version, deleted: row.deleted });
      if (!data || data.length < 500) return result;
    }
  },
};
