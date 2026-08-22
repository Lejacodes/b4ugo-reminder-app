-- BLUGO backend foundation
-- Apply in the Supabase SQL editor or via `supabase db push`.
-- RLS is required. Policies always use auth.uid().

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  context_aware boolean not null default true,
  routines_enabled boolean not null default true,
  ai_parsing_enabled boolean not null default false,
  location_reminders_enabled boolean not null default false,
  push_enabled boolean not null default true,
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy user_preferences_select_own on public.user_preferences
  for select using (auth.uid() = user_id);
create policy user_preferences_insert_own on public.user_preferences
  for insert with check (auth.uid() = user_id);
create policy user_preferences_update_own on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_preferences_delete_own on public.user_preferences
  for delete using (auth.uid() = user_id);

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New-account rows (never trust a client-supplied user_id for this)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- personal_necessities
-- ---------------------------------------------------------------------------

create table if not exists public.personal_necessities (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'essentials',
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_necessities_user_id_idx
  on public.personal_necessities (user_id);

alter table public.personal_necessities enable row level security;

create policy personal_necessities_select_own on public.personal_necessities
  for select using (auth.uid() = user_id);
create policy personal_necessities_insert_own on public.personal_necessities
  for insert with check (auth.uid() = user_id);
create policy personal_necessities_update_own on public.personal_necessities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy personal_necessities_delete_own on public.personal_necessities
  for delete using (auth.uid() = user_id);

drop trigger if exists personal_necessities_set_updated_at on public.personal_necessities;
create trigger personal_necessities_set_updated_at
  before update on public.personal_necessities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trip_contexts (daily departures AND planned trips)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_contexts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('departure', 'trip')),
  title text,
  destination text not null,
  purpose text,
  latitude double precision,
  longitude double precision,
  timezone text,
  country text,
  region text,
  start_date date,
  end_date date,
  duration integer,
  season text,
  activity text,
  accommodation text,
  transportation text,
  notes text,
  status text not null default 'planned',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_contexts_user_id_idx
  on public.trip_contexts (user_id);

alter table public.trip_contexts enable row level security;

create policy trip_contexts_select_own on public.trip_contexts
  for select using (auth.uid() = user_id);
create policy trip_contexts_insert_own on public.trip_contexts
  for insert with check (auth.uid() = user_id);
create policy trip_contexts_update_own on public.trip_contexts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy trip_contexts_delete_own on public.trip_contexts
  for delete using (auth.uid() = user_id);

drop trigger if exists trip_contexts_set_updated_at on public.trip_contexts;
create trigger trip_contexts_set_updated_at
  before update on public.trip_contexts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- trip_items (packing checklist for a planned trip)
-- ---------------------------------------------------------------------------

create table if not exists public.trip_items (
  id text primary key,
  trip_id text not null references public.trip_contexts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'other',
  source text not null default 'user',
  status text not null default 'open',
  reason text,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_items_trip_id_idx on public.trip_items (trip_id);
create index if not exists trip_items_user_id_idx on public.trip_items (user_id);

alter table public.trip_items enable row level security;

create policy trip_items_select_own on public.trip_items
  for select using (auth.uid() = user_id);
create policy trip_items_insert_own on public.trip_items
  for insert with check (auth.uid() = user_id);
create policy trip_items_update_own on public.trip_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy trip_items_delete_own on public.trip_items
  for delete using (auth.uid() = user_id);

drop trigger if exists trip_items_set_updated_at on public.trip_items;
create trigger trip_items_set_updated_at
  before update on public.trip_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reminders (Before U Go rows, On the Way Back, specific)
-- ---------------------------------------------------------------------------

create table if not exists public.reminders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null check (type in ('beforeUgo', 'onTheWayBack', 'specific')),
  status text not null default 'open' check (status in ('open', 'done')),
  place_name text,
  latitude double precision,
  longitude double precision,
  context_id text references public.trip_contexts (id) on delete set null,
  layer text,
  reason text,
  source text not null default 'user',
  person text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_user_id_idx on public.reminders (user_id);
create index if not exists reminders_context_id_idx on public.reminders (context_id);

alter table public.reminders enable row level security;

create policy reminders_select_own on public.reminders
  for select using (auth.uid() = user_id);
create policy reminders_insert_own on public.reminders
  for insert with check (auth.uid() = user_id);
create policy reminders_update_own on public.reminders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy reminders_delete_own on public.reminders
  for delete using (auth.uid() = user_id);

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- saved_places_or_intentions
-- ---------------------------------------------------------------------------

create table if not exists public.saved_places_or_intentions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id text references public.trip_contexts (id) on delete cascade,
  title text not null,
  type text not null default 'other',
  notes text,
  place_name text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intentions_user_id_idx
  on public.saved_places_or_intentions (user_id);
create index if not exists intentions_trip_id_idx
  on public.saved_places_or_intentions (trip_id);

alter table public.saved_places_or_intentions enable row level security;

create policy intentions_select_own on public.saved_places_or_intentions
  for select using (auth.uid() = user_id);
create policy intentions_insert_own on public.saved_places_or_intentions
  for insert with check (auth.uid() = user_id);
create policy intentions_update_own on public.saved_places_or_intentions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy intentions_delete_own on public.saved_places_or_intentions
  for delete using (auth.uid() = user_id);

drop trigger if exists intentions_set_updated_at on public.saved_places_or_intentions;
create trigger intentions_set_updated_at
  before update on public.saved_places_or_intentions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- packing_templates
-- ---------------------------------------------------------------------------

create table if not exists public.packing_templates (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  activity text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packing_templates_user_id_idx
  on public.packing_templates (user_id);

alter table public.packing_templates enable row level security;

create policy packing_templates_select_own on public.packing_templates
  for select using (auth.uid() = user_id);
create policy packing_templates_insert_own on public.packing_templates
  for insert with check (auth.uid() = user_id);
create policy packing_templates_update_own on public.packing_templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy packing_templates_delete_own on public.packing_templates
  for delete using (auth.uid() = user_id);

drop trigger if exists packing_templates_set_updated_at on public.packing_templates;
create trigger packing_templates_set_updated_at
  before update on public.packing_templates
  for each row execute function public.set_updated_at();
