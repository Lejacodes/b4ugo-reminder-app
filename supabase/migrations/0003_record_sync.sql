-- Canonical per-record sync. Old tables are retained for rollback evidence.
create table public.domain_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('reminders','necessities','context','profile','preferences','trips','packingItems','packingTemplates','travelIntentions','savedPlaces')),
  record_id text not null check (length(record_id) between 1 and 200),
  payload jsonb,
  version bigint not null default 1 check (version > 0),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, record_id)
);
create table public.record_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);
alter table public.domain_records enable row level security;
alter table public.record_operations enable row level security;
create policy own_records_read on public.domain_records for select to authenticated using (user_id = auth.uid());
revoke all on public.domain_records, public.record_operations from anon, authenticated;
grant select on public.domain_records to authenticated;
grant select on public.domain_records to service_role;

-- Data-preserving backfill uses the same camelCase contract as the app.
insert into public.domain_records (user_id, collection, record_id, payload)
select id, 'profile', 'current', jsonb_build_object('userId',id,'displayName',display_name,'interests',interests,'createdAt',created_at,'updatedAt',updated_at)
from public.profiles;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'preferences', 'current', jsonb_build_object('appearance',theme,'hasCompletedOnboarding',has_completed_onboarding,
 'notifications',jsonb_build_object('pushEnabled',push_enabled),
 'reminders',jsonb_build_object('preferContextual',context_aware,'locationRemindersEnabled',location_reminders_enabled,'routineRemindersEnabled',routines_enabled),
 'privacy',jsonb_build_object('analyticsEnabled',false,'aiParsingEnabled',ai_parsing_enabled))
from public.user_preferences;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'reminders', id, jsonb_build_object(
 'id',id,'title',title,'category',type,'status',status,'createdAt',created_at,'updatedAt',updated_at,
 'source',source,'layer',layer,'contextId',case when exists(select 1 from public.trip_contexts t where t.id=r.context_id and t.user_id=r.user_id and (t.kind='trip' or t.is_active)) then context_id else null end,'reason',reason,'person',person,'dueAt',due_at,
 'location',case when place_name is null then null else jsonb_build_object('placeName',place_name,'latitude',latitude,'longitude',longitude,'radiusMeters',null) end)
from public.reminders r;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'necessities', id, jsonb_build_object('id',id,'title',title,'source',source,'createdAt',created_at)
from public.personal_necessities;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'trips', id, jsonb_build_object('id',id,'title',coalesce(title,destination),'destination',destination,
 'startDate',start_date,'endDate',end_date,'durationDays',duration,'activity',activity,'season',season,
 'accommodation',accommodation,'transportation',transportation,'notes',notes,'status',status,
 'createdAt',created_at,'updatedAt',updated_at,'latitude',latitude,'longitude',longitude,'timezone',timezone,'country',country,'region',region)
from public.trip_contexts where kind = 'trip';
insert into public.domain_records (user_id, collection, record_id, payload)
select distinct on (user_id) user_id, 'context', 'current', jsonb_build_object('id',id,'destination',destination,
 'purpose',purpose,'person',null,'dateTime',null,'createdAt',created_at,'latitude',latitude,'longitude',longitude,
 'timezone',timezone,'country',country,'region',region)
from public.trip_contexts where kind = 'departure' and is_active order by user_id, created_at desc;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'packingItems', id, jsonb_build_object('id',id,'tripId',trip_id,'title',title,'category',category,
 'checked',status = 'done','source',source,'reason',reason,'dismissed',dismissed,'createdAt',created_at,'updatedAt',updated_at)
from public.trip_items;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, 'packingTemplates', id, jsonb_build_object('id',id,'name',name,'items',items,'createdAt',created_at,'updatedAt',updated_at)
from public.packing_templates;
insert into public.domain_records (user_id, collection, record_id, payload)
select user_id, case when trip_id is null then 'savedPlaces' else 'travelIntentions' end, id,
case when trip_id is null then jsonb_build_object('id',id,'name',title,'label',notes,'type',type,'latitude',latitude,
 'longitude',longitude,'isActive',true,'createdAt',created_at,'updatedAt',updated_at)
else jsonb_build_object('id',id,'tripId',trip_id,'title',title,'type',type,'placeName',place_name,'latitude',latitude,
 'longitude',longitude,'note',notes,'createdAt',created_at,'updatedAt',updated_at) end
from public.saved_places_or_intentions;

create or replace function public.apply_record_operation(
 p_operation_id text, p_collection text, p_record_id text, p_base_version bigint, p_payload jsonb, p_deleted boolean
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
 owner_id uuid := auth.uid();
 existing public.domain_records;
 answer jsonb;
 parent_id text;
begin
 if owner_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
 if length(p_operation_id) not between 1 and 200 or p_base_version < 0 or
    p_collection not in ('reminders','necessities','context','profile','preferences','trips','packingItems','packingTemplates','travelIntentions','savedPlaces') or
    length(p_record_id) not between 1 and 200 or octet_length(coalesce(p_payload::text,'')) > 262144 then
   raise exception 'invalid operation';
 end if;
 -- Serialize the owner's operations, including parent/child changes and receipt retries.
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
 select result into answer from public.record_operations where user_id = owner_id and operation_id = p_operation_id;
 if found then return answer; end if;
 select * into existing from public.domain_records where user_id = owner_id and collection = p_collection and record_id = p_record_id for update;
 if coalesce(existing.version, 0) <> p_base_version then
   return jsonb_build_object('conflict',true,'record',jsonb_build_object('collection',existing.collection,'id',existing.record_id,
    'value',existing.payload,'version',existing.version,'deleted',existing.deleted));
 end if;
 if not p_deleted then
   if jsonb_typeof(p_payload) <> 'object' then raise exception 'record must be an object'; end if;
   if p_collection not in ('context','profile','preferences') and p_payload->>'id' is distinct from p_record_id then raise exception 'record id mismatch'; end if;
   if p_collection in ('packingItems','travelIntentions') then
     parent_id := p_payload->>'tripId';
     if not exists (select 1 from public.domain_records where user_id = owner_id and collection = 'trips' and record_id = parent_id and not deleted) then
       raise exception 'trip not available to this account' using errcode = '42501';
     end if;
   end if;
   if p_collection='reminders' and p_payload->>'contextId' is not null then
     parent_id := p_payload->>'contextId';
     if not exists(select 1 from public.domain_records where user_id=owner_id and not deleted and
       ((collection='context' and payload->>'id'=parent_id) or (collection='trips' and record_id=parent_id))) then
       raise exception 'departure not available to this account' using errcode='42501';
     end if;
   end if;
 end if;
 insert into public.domain_records(user_id,collection,record_id,payload,version,deleted)
 values(owner_id,p_collection,p_record_id,p_payload,p_base_version+1,p_deleted)
 on conflict(user_id,collection,record_id) do update set payload=excluded.payload,version=excluded.version,deleted=excluded.deleted,updated_at=now();
 if p_deleted and p_collection = 'trips' then
   update public.domain_records set deleted=true,version=version+1,updated_at=now()
   where user_id=owner_id and collection in ('packingItems','travelIntentions') and payload->>'tripId'=p_record_id and not deleted;
 end if;
 answer := jsonb_build_object('conflict',false,'record',jsonb_build_object('collection',p_collection,'id',p_record_id,
   'value',p_payload,'version',p_base_version+1,'deleted',p_deleted));
 insert into public.record_operations(user_id,operation_id,result) values(owner_id,p_operation_id,answer);
 return answer;
end $$;
revoke all on function public.apply_record_operation(text,text,text,bigint,jsonb,boolean) from public, anon;
grant execute on function public.apply_record_operation(text,text,text,bigint,jsonb,boolean) to authenticated;

-- Retire the old write protocol after cutover; old binaries must be replaced.
-- Snapshot tables remain readable as recovery evidence; all new writes use CAS.
revoke insert,update,delete on public.reminders,public.personal_necessities,public.trip_contexts,
 public.trip_items,public.packing_templates,public.saved_places_or_intentions,public.profiles,public.user_preferences from authenticated,anon;
