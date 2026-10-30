import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';
import { authorizedScheduler, ticketOutcome, type PushTicket } from '../../../src/lib/notifications/push-delivery.ts';

/** Scheduled POST with x-cron-secret. Deploy migration 0003/0004 first. */
Deno.serve(async (req) => {
  if (!authorizedScheduler(req.method, req.headers.get('x-cron-secret'), Deno.env.get('PUSH_SCHEDULER_SECRET'))) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return Response.json({ error: 'missing-config' }, { status: 503 });
  const db = createClient(url, key);
  const now = Date.now();
  const checked = async (request: PromiseLike<{ error: unknown }>) => {
    const result = await request;
    if (result.error) throw new Error('Database operation failed');
  };
  try {
    // A stale sender may have reached Expo before losing its response. Never blindly resend it.
    await checked(db.from('push_attempts').update({ state: 'uncertain', error_code: 'SenderInterrupted' })
      .eq('state', 'sending').lt('updated_at', new Date(now - 300_000).toISOString()));
    const { data: accepted, error: receiptReadError } = await db.from('push_attempts').select('id,ticket_id,token_id')
      .eq('state', 'accepted').lt('updated_at', new Date(now - 900_000).toISOString()).limit(100);
    if (receiptReadError) throw receiptReadError;
    if (accepted?.length) {
      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: accepted.map((row) => row.ticket_id) }), signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        const payload = await response.json();
        for (const attempt of accepted) {
          const receipt = payload.data?.[attempt.ticket_id];
          if (!receipt) continue;
          const invalid = receipt.details?.error === 'DeviceNotRegistered';
          await checked(db.from('push_attempts').update({ state: receipt.status === 'ok' ? 'delivered' : 'failed',
            error_code: receipt.details?.error ?? null, retry_at: new Date(now + 300_000).toISOString(), updated_at: new Date(now).toISOString() }).eq('id', attempt.id));
          if (invalid) await checked(db.from('push_tokens').delete().eq('id', attempt.token_id));
        }
      }
    }

    // Catch up a missed schedule for up to 24 hours; never send before due time.
    const { data: records, error } = await db.from('domain_records').select('user_id,record_id,payload')
      .eq('collection', 'reminders').eq('deleted', false).eq('payload->>status', 'open')
      .gte('payload->>dueAt', new Date(now - 86_400_000).toISOString()).lte('payload->>dueAt', new Date(now).toISOString()).limit(500);
    if (error) throw error;
    for (const row of records ?? []) {
      const { data: preference, error: prefError } = await db.from('domain_records').select('payload')
        .eq('user_id', row.user_id).eq('collection', 'preferences').eq('record_id', 'current').eq('deleted', false).maybeSingle();
      if (prefError) throw prefError;
      if (preference?.payload?.notifications?.pushEnabled !== true) continue;
      const { data: tokens, error: tokenError } = await db.from('push_tokens').select('id').eq('user_id', row.user_id).eq('delivery_mode','remote');
      if (tokenError) throw tokenError;
      for (const token of tokens ?? []) await checked(db.from('push_attempts').upsert({ user_id: row.user_id,
        reminder_id: row.record_id, due_at: row.payload.dueAt, token_id: token.id },
        { onConflict: 'user_id,reminder_id,due_at,token_id', ignoreDuplicates: true }));
    }
    const { data: attempts, error: claimError } = await db.rpc('claim_push_attempts');
    if (claimError) throw claimError;
    let acceptedCount = 0;
    for (const attempt of attempts ?? []) {
      const [{ data: token }, { data: record }, { data: preference }] = await Promise.all([
        db.from('push_tokens').select('expo_push_token').eq('id', attempt.token_id).eq('user_id', attempt.user_id).eq('delivery_mode','remote').maybeSingle(),
        db.from('domain_records').select('payload,deleted').eq('user_id', attempt.user_id).eq('collection', 'reminders').eq('record_id', attempt.reminder_id).maybeSingle(),
        db.from('domain_records').select('payload').eq('user_id', attempt.user_id).eq('collection', 'preferences').eq('record_id', 'current').eq('deleted', false).maybeSingle(),
      ]);
      if (!token || !record || record.deleted || record.payload.status !== 'open' || record.payload.dueAt !== attempt.due_at && Date.parse(record.payload.dueAt) !== Date.parse(attempt.due_at) || preference?.payload?.notifications?.pushEnabled !== true) {
        await checked(db.from('push_attempts').update({ state: 'uncertain', error_code: 'NoLongerEligible' }).eq('id', attempt.id));
        continue;
      }
      try {
        const category = record.payload.category;
        const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify([{ to: token.expo_push_token, title: 'B4UGO', body: 'A reminder is ready. Open B4UGO to view your list.',
            data: { href: category === 'onTheWayBack' ? '/on-the-way-back' : category === 'beforeUgo' ? '/before-ugo' : '/reminders', deliveryKey: `${attempt.reminder_id}:${attempt.due_at}` }, sound: 'default' }]),
          signal: AbortSignal.timeout(15_000) });
        const payload = response.ok ? await response.json() : null;
        const outcome = response.ok ? ticketOutcome(payload?.data?.[0] as PushTicket | undefined)
          : { state: 'failed', error: `HTTP${response.status}`, invalidToken: false, ticketId: undefined };
        await checked(db.from('push_attempts').update({ state: outcome.state, ticket_id: outcome.ticketId ?? null,
          error_code: outcome.error ?? null, retry_at: new Date(now + Math.min(3_600_000, 30_000 * 2 ** attempt.attempts)).toISOString(),
          updated_at: new Date().toISOString() }).eq('id', attempt.id));
        if (outcome.invalidToken) await checked(db.from('push_tokens').delete().eq('id', attempt.token_id));
        if (outcome.state === 'accepted') acceptedCount += 1;
      } catch {
        await checked(db.from('push_attempts').update({ state: 'uncertain', error_code: 'ResponseUnknown', updated_at: new Date().toISOString() }).eq('id', attempt.id));
      }
    }
    return Response.json({ accepted: acceptedCount });
  } catch {
    return Response.json({ error: 'delivery-unavailable' }, { status: 503 });
  }
});
