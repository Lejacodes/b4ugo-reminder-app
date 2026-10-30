import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the actual Edge Function handler with an injected database/Expo
// endpoint. Real SQL authorization/claims are covered by test-database.mjs.
function loadModule(source, dependencies, extras = {}) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const names = ['require', 'exports', ...Object.keys(extras)];
  new Function(...names, code)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, exports, ...Object.values(extras));
  return exports;
}
const contracts = loadModule(await readFile(new URL('../src/lib/notifications/push-delivery.ts', import.meta.url), 'utf8'), {});
const source = await readFile(new URL('../supabase/functions/due-reminder-push/index.ts', import.meta.url), 'utf8');
const secret = 'test-scheduler-secret-'.repeat(3);
const now = Date.now();
const dueAt = new Date(now - 10_000).toISOString();

function fixture() {
  return {
    domain_records: [
      { user_id: 'owner', collection: 'reminders', record_id: 'one', deleted: false, payload: { id: 'one', status: 'open', dueAt, title: 'Private content', category: 'specific' } },
      { user_id: 'owner', collection: 'preferences', record_id: 'current', deleted: false, payload: { notifications: { pushEnabled: true } } },
    ],
    push_tokens: [{ id: 'token-one', user_id: 'owner', expo_push_token: 'ExpoPushToken[test]', delivery_mode: 'remote' }],
    push_attempts: [],
  };
}
function database(tables) {
  let sequence = 0;
  const field = (row, key) => key.includes('->>') ? row[key.split('->>')[0]]?.[key.split('->>')[1]] : row[key];
  return {
    from(name) {
      const filters = [];
      let action = 'select'; let payload; let options = {}; let single = false; let maximum = Infinity;
      const query = {
        select() { return query; },
        eq(key, value) { filters.push((row) => field(row, key) === value); return query; },
        gte(key, value) { filters.push((row) => field(row, key) >= value); return query; },
        lte(key, value) { filters.push((row) => field(row, key) <= value); return query; },
        lt(key, value) { filters.push((row) => field(row, key) < value); return query; },
        limit(value) { maximum = value; return query; },
        update(value) { action = 'update'; payload = value; return query; },
        delete() { action = 'delete'; return query; },
        upsert(value, config) { action = 'upsert'; payload = value; options = config; return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            let rows = tables[name].filter((row) => filters.every((filter) => filter(row))).slice(0, maximum);
            if (action === 'update') for (const row of rows) Object.assign(row, payload);
            if (action === 'delete') tables[name] = tables[name].filter((row) => !rows.includes(row));
            if (action === 'upsert') {
              const keys = options.onConflict.split(',');
              const existing = tables[name].find((row) => keys.every((key) => row[key] === payload[key]));
              if (!existing) tables[name].push({ id: `attempt-${++sequence}`, state: 'queued', attempts: 0, updated_at: new Date(now).toISOString(), retry_at: new Date(now).toISOString(), ...payload });
              rows = [];
            }
            return { data: single ? rows[0] ?? null : rows, error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
    async rpc(name) {
      assert.equal(name, 'claim_push_attempts');
      const rows = tables.push_attempts.filter((row) => ['queued', 'failed'].includes(row.state) && Date.parse(row.retry_at) <= Date.now() && row.attempts < 6).slice(0, 100);
      for (const row of rows) { row.state = 'sending'; row.attempts++; row.updated_at = new Date().toISOString(); }
      return { data: rows.map((row) => ({ ...row })), error: null };
    },
  };
}
function handler(tables, expo) {
  let handle;
  loadModule(source, {
    'https://esm.sh/@supabase/supabase-js@2.112.3': { createClient: () => database(tables) },
    '../../../src/lib/notifications/push-delivery.ts': contracts,
  }, {
    Deno: { env: { get: (key) => ({ SUPABASE_URL: 'https://example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only', PUSH_SCHEDULER_SECRET: secret })[key] }, serve: (callback) => { handle = callback; } },
    fetch: expo,
  });
  return (authorized = true) => handle(new Request('https://example.invalid/sender', { method: 'POST', headers: authorized ? { 'x-cron-secret': secret } : {} }));
}

let checks = 0;
{
  const tables = fixture(); let calls = 0;
  const invoke = handler(tables, async () => { calls++; return Response.json({ data: [{ status: 'ok', id: 'ticket-one' }] }); });
  assert.equal((await invoke(false)).status, 401);
  assert.equal(calls, 0); checks++;
  assert.equal((await (await invoke()).json()).accepted, 1);
  assert.equal(tables.push_attempts[0].state, 'accepted'); checks++;
  await invoke();
  assert.equal(calls, 1); checks++;
}
{
  const tables = fixture();
  const invoke = handler(tables, async () => Response.json({ data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] }));
  assert.equal((await (await invoke()).json()).accepted, 0);
  assert.equal(tables.push_attempts[0].state, 'failed');
  assert.equal(tables.push_tokens.length, 0); checks++;
}
{
  const tables = fixture(); let calls = 0;
  const invoke = handler(tables, async () => { calls++; throw new Error('lost response'); });
  await invoke(); await invoke();
  assert.equal(tables.push_attempts[0].state, 'uncertain');
  assert.equal(calls, 1); checks++;
}
{
  const tables = fixture(); let calls = 0;
  const invoke = handler(tables, async () => { calls++; return Response.json({}, { status: 503 }); });
  await invoke();
  assert.equal(tables.push_attempts[0].state, 'failed');
  assert.equal(tables.push_attempts[0].ticket_id, null);
  await invoke(); assert.equal(calls, 1); checks++;
}
{
  const tables = fixture(); let calls = 0;
  tables.push_tokens[0].delivery_mode = 'local';
  const invoke = handler(tables, async () => { calls++; throw new Error('must not send'); });
  await invoke(); assert.equal(calls, 0); checks++;
}
{
  const tables = fixture(); let calls = 0;
  tables.domain_records[0].payload.dueAt = new Date(now + 60_000).toISOString();
  const invoke = handler(tables, async () => { calls++; throw new Error('must not send early'); });
  await invoke(); assert.equal(calls, 0); checks++;
}
{
  const tables = fixture(); let calls = 0;
  const invoke = handler(tables, async (_url, input) => {
    calls++;
    assert.doesNotMatch(input.body, /Private content/);
    return Response.json({ data: [{ status: 'ok', id: 'ticket-one' }] });
  });
  await Promise.all([invoke(), invoke()]);
  assert.equal(calls, 1); checks++;
}
{
  const tables = fixture();
  tables.push_attempts.push({ id: 'accepted', user_id: 'owner', token_id: 'token-one', reminder_id: 'one', due_at: dueAt,
    state: 'accepted', ticket_id: 'ticket-one', attempts: 1, updated_at: new Date(now - 1_000_000).toISOString() });
  const invoke = handler(tables, async (url) => {
    assert.match(url, /getReceipts/);
    return Response.json({ data: { 'ticket-one': { status: 'error', details: { error: 'DeviceNotRegistered' } } } });
  });
  await invoke(); assert.equal(tables.push_tokens.length, 0); checks++;
}
console.log(`Push handler integration: ${checks} scenarios passed; authorization, acceptance, dedupe, invalid tokens, HTTP failure, uncertain response, delivery route, no early send, overlapping invocation, receipts.`);
