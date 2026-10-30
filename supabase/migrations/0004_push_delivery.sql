alter table public.push_tokens add column installation_id text;
alter table public.push_tokens add column delivery_mode text not null default 'local' check (delivery_mode in ('local','remote'));
-- Existing rows remain usable until each installation registers. Never delete all tokens.
create unique index push_tokens_installation on public.push_tokens(user_id, installation_id);

create table public.push_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 reminder_id text not null,
 due_at timestamptz not null,
 token_id uuid not null references public.push_tokens(id) on delete cascade,
 state text not null default 'queued' check(state in ('queued','sending','accepted','delivered','failed','uncertain')),
 ticket_id text,
 error_code text,
 attempts integer not null default 0,
 retry_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,reminder_id,due_at,token_id)
);
alter table public.push_attempts enable row level security;
create policy own_push_attempts on public.push_attempts for select to authenticated using (user_id=auth.uid());
revoke all on public.push_attempts from anon, authenticated;
grant select on public.push_attempts to authenticated;
grant all on public.push_attempts to service_role;
grant select,delete on public.push_tokens to service_role;

-- One invocation claims a batch. A timeout after submitting is uncertain and must
-- not be automatically resent: Expo has no idempotency key for send requests.
create function public.claim_push_attempts() returns setof public.push_attempts
language sql security definer set search_path=public,pg_temp as $$
 update public.push_attempts set state='sending',attempts=attempts+1,updated_at=now()
 where id in (select id from public.push_attempts where state in ('queued','failed') and retry_at<=now() and attempts<6
 order by retry_at for update skip locked limit 100) returning *;
$$;
revoke all on function public.claim_push_attempts() from public,anon,authenticated;
grant execute on function public.claim_push_attempts() to service_role;
