import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated Postgres engine, synthetic auth schema/roles; no hosted credentials.
const db = new PGlite();
const userA = '00000000-0000-0000-0000-000000000001';
const userB = '00000000-0000-0000-0000-000000000002';
let assertions = 0;
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, public to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
  `);
  for (const name of ['0001_init.sql', '0002_push_tokens.sql']) {
    const sql = await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
    // pgcrypto is a Supabase extension; core Postgres provides gen_random_uuid.
    await db.exec(sql.replace('create extension if not exists pgcrypto;', ''));
  }
  await db.query('insert into auth.users values ($1),($2)', [userA, userB]);
  await db.query("insert into public.reminders(id,user_id,title,type) values ('legacy', $1, 'Legacy keys', 'specific')", [userA]);
  for (const name of ['0003_record_sync.sql', '0004_push_delivery.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  // Supabase's hosted default table grants; policies still enforce the owner.
  await db.exec('grant select,insert,update,delete on public.push_tokens to authenticated');
  await db.query("insert into public.push_tokens(user_id,expo_push_token,platform,installation_id) values ($1,'ExpoPushToken[a]','ios',null),($1,'ExpoPushToken[b]','android','device-b')", [userA]);
  assert.equal((await db.query("select payload->>'title' as title from domain_records where collection='reminders' and record_id='legacy'")).rows[0].title, 'Legacy keys'); assertions++;
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userA]);
  const apply = async (operation, collection, id, base, payload, deleted = false) =>
    (await db.query('select public.apply_record_operation($1,$2,$3,$4,$5::jsonb,$6) as result', [operation, collection, id, base, JSON.stringify(payload), deleted])).rows[0].result;
  const first = await apply('create-1', 'reminders', 'one', 0, { id: 'one', title: 'Keys' });
  assert.equal(first.record.version, 1); assertions++;
  assert.deepEqual(await apply('create-1', 'reminders', 'one', 0, { id: 'one', title: 'Keys' }), first); assertions++;
  const edit = await apply('edit-1', 'reminders', 'one', 1, { id: 'one', title: 'New keys' });
  assert.equal(edit.record.version, 2); assertions++;
  const stale = await apply('stale-1', 'reminders', 'one', 1, { id: 'one', title: 'Stale keys' });
  assert.equal(stale.conflict, true); assertions++;
  assert.equal(stale.record.value.title, 'New keys'); assertions++;
  await db.query("delete from push_tokens where user_id=$1 and expo_push_token='ExpoPushToken[a]' and installation_id is null", [userA]);
  await db.query("insert into push_tokens(user_id,expo_push_token,platform,installation_id) values ($1,'ExpoPushToken[a]','ios','device-a') on conflict(user_id,installation_id) do update set expo_push_token=excluded.expo_push_token", [userA]);
  assert.equal((await db.query('select * from push_tokens')).rows.length, 2); assertions++;
  assert.equal((await db.query("select expo_push_token from push_tokens where installation_id='device-b'")).rows[0].expo_push_token, 'ExpoPushToken[b]'); assertions++;
  await db.query("delete from push_tokens where user_id=$1 and installation_id='device-a'", [userA]);
  assert.equal((await db.query('select installation_id from push_tokens')).rows[0].installation_id, 'device-b'); assertions++;
  await apply('trip-1', 'trips', 'trip-a', 0, { id: 'trip-a', destination: 'Home' });
  await apply('pack-1', 'packingItems', 'pack-a', 0, { id: 'pack-a', tripId: 'trip-a', title: 'Bag' });
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userB]);
  assert.equal((await db.query('select * from push_tokens')).rows.length, 0); assertions++;
  assert.equal((await db.query("select * from domain_records where record_id='one'")).rows.length, 0); assertions++;
  await assert.rejects(apply('foreign-child', 'packingItems', 'foreign', 0, { id: 'foreign', tripId: 'trip-a' }), /trip not available/); assertions++;
  await assert.rejects(apply('foreign-context', 'reminders', 'foreign-reminder', 0, { id: 'foreign-reminder', contextId: 'trip-a' }), /departure not available/); assertions++;
  await assert.rejects(db.query("update domain_records set deleted=true where record_id='one'"), /permission denied/); assertions++;
  const own = await apply('create-1', 'reminders', 'one', 0, { id: 'one', title: 'B private' });
  assert.equal(own.record.value.title, 'B private'); assertions++;
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userA]);
  await apply('trip-delete', 'trips', 'trip-a', 1, null, true);
  assert.equal((await db.query("select deleted from domain_records where record_id='pack-a'")).rows[0].deleted, true); assertions++;
  await db.exec('set role anon');
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  await assert.rejects(apply('anon', 'reminders', 'x', 0, { id: 'x' }), /permission denied/); assertions++;
  await db.exec('reset role');
  assert.equal((await db.query("select count(*)::int as count from domain_records where collection='reminders' and record_id='one'")).rows[0].count, 2); assertions++;
  await db.query("insert into push_attempts(user_id,reminder_id,due_at,token_id) select $1,'one',now(),id from push_tokens where installation_id='device-b'", [userA]);
  await db.exec('set role service_role');
  assert.equal((await db.query('select * from claim_push_attempts()')).rows.length, 1); assertions++;
  assert.equal((await db.query('select * from claim_push_attempts()')).rows.length, 0); assertions++;
  console.log(`Database integration: ${assertions} assertions passed; migrations 0001–0004, backfill, operation retry, revisions, RLS, ownership, cascade, anonymous denial, installation isolation, delivery claims.`);
} finally {
  await db.close();
}
