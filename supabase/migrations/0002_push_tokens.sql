-- Expo push tokens + delivery dedupe for server-sent due reminders

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy push_tokens_select_own on public.push_tokens
  for select using (auth.uid() = user_id);
create policy push_tokens_insert_own on public.push_tokens
  for insert with check (auth.uid() = user_id);
create policy push_tokens_update_own on public.push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy push_tokens_delete_own on public.push_tokens
  for delete using (auth.uid() = user_id);

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_id text not null,
  due_at timestamptz not null,
  sent_at timestamptz not null default now(),
  unique (reminder_id, due_at)
);

create index if not exists push_delivery_log_user_id_idx on public.push_delivery_log (user_id);

alter table public.push_delivery_log enable row level security;

-- Users can read their own delivery log; inserts happen from the edge function (service role).
create policy push_delivery_log_select_own on public.push_delivery_log
  for select using (auth.uid() = user_id);
