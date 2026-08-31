/**
 * Sends push notifications for reminders whose due_at falls in the current minute.
 *
 * Invoke on a schedule (Supabase cron / external scheduler), e.g. every minute:
 *   POST /functions/v1/due-reminder-push
 *   Authorization: Bearer <service_role_key>
 *
 * Uses Expo Push API — no APNs key in this function; Expo handles delivery.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ReminderRow = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  due_at: string;
  context_id: string | null;
  place_name: string | null;
  reason: string | null;
};

type PushTokenRow = {
  expo_push_token: string;
};

function hrefForReminder(row: ReminderRow): string {
  if (row.type === 'onTheWayBack') return '/on-the-way-back';
  if (row.type === 'beforeUgo') return '/before-ugo';
  if (row.context_id?.startsWith('trip-')) return `/trip/${row.context_id}`;
  return '/reminders';
}

function bodyForReminder(row: ReminderRow): string {
  return row.place_name ?? row.reason ?? 'later';
}

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data: { href: string };
  sound: 'default';
};

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('[due-reminder-push] expo push failed', response.status, text);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing-config' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(url, serviceKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() - 90_000);
  const windowEnd = new Date(now.getTime() + 90_000);

  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('id, user_id, title, type, due_at, context_id, place_name, reason')
    .eq('status', 'open')
    .not('due_at', 'is', null)
    .gte('due_at', windowStart.toISOString())
    .lte('due_at', windowEnd.toISOString());

  if (remindersError) {
    return new Response(JSON.stringify({ error: remindersError.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const rows = (reminders ?? []) as ReminderRow[];
  if (rows.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, push_enabled')
    .in('user_id', userIds);

  const pushEnabled = new Map<string, boolean>(
    (prefs ?? []).map((row: { user_id: string; push_enabled: boolean }) => [
      row.user_id,
      row.push_enabled,
    ]),
  );

  const messages: ExpoPushMessage[] = [];
  let sent = 0;

  for (const row of rows) {
    if (pushEnabled.get(row.user_id) === false) continue;

    const { data: existing } = await supabase
      .from('push_delivery_log')
      .select('id')
      .eq('reminder_id', row.id)
      .eq('due_at', row.due_at)
      .maybeSingle();
    if (existing) continue;

    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', row.user_id);

    if (tokenError || !tokens?.length) continue;

    for (const tokenRow of tokens as PushTokenRow[]) {
      messages.push({
        to: tokenRow.expo_push_token,
        title: row.title,
        body: bodyForReminder(row),
        data: { href: hrefForReminder(row) },
        sound: 'default',
      });
    }

    await supabase.from('push_delivery_log').insert({
      user_id: row.user_id,
      reminder_id: row.id,
      due_at: row.due_at,
    });
    sent += 1;
  }

  await sendExpoPush(messages);

  return new Response(JSON.stringify({ sent, messages: messages.length }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
