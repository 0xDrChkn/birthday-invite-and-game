-- Run once in the Supabase SQL editor as the project administrator.
-- Repeat runs are safe: policies/functions are replaced, guest data is retained.
begin;

create table if not exists public.birthday_events (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  is_open boolean not null default true
);

create table if not exists public.birthday_organisers (
  event_id text not null references public.birthday_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (event_id, user_id)
);

-- Only client-generated metadata is accepted. Object paths are derived from
-- event_id / authenticated user_id / slot; never trust a submitted URL or path.
create or replace function public.birthday_valid_photos(manifest jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  photo jsonb;
  slots integer[] := '{}';
  slot integer;
begin
  if manifest is null or pg_catalog.jsonb_typeof(manifest) <> 'array' then return false; end if;
  if pg_catalog.jsonb_array_length(manifest) > 3 then return false; end if;
  for photo in select value from pg_catalog.jsonb_array_elements(manifest) loop
    if pg_catalog.jsonb_typeof(photo) <> 'object'
      or not (photo ?& array['slot', 'name', 'size', 'type'])
      or photo - array['slot', 'name', 'size', 'type'] <> '{}'::jsonb then return false; end if;
    if pg_catalog.jsonb_typeof(photo->'slot') <> 'number'
      or photo->>'slot' not in ('1', '2', '3') then return false; end if;
    slot := (photo->>'slot')::integer;
    if slot = any(slots) then return false; end if;
    slots := pg_catalog.array_append(slots, slot);
    if pg_catalog.jsonb_typeof(photo->'name') <> 'string'
      or pg_catalog.char_length(pg_catalog.btrim(photo->>'name')) not between 1 and 200
      or pg_catalog.char_length(photo->>'name') > 200 then return false; end if;
    if pg_catalog.jsonb_typeof(photo->'size') <> 'number'
      or (photo->>'size') !~ '^[1-9][0-9]*$' then return false; end if;
    if (photo->>'size')::numeric > 20971520 then return false; end if;
    if pg_catalog.jsonb_typeof(photo->'type') <> 'string'
      or photo->>'type' not in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif') then return false; end if;
  end loop;
  return true;
end;
$$;

create table if not exists public.birthday_responses (
  event_id text not null references public.birthday_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 120),
  accepted boolean not null,
  story text not null default '' check (char_length(story) <= 3000),
  photos jsonb not null default '[]'::jsonb check (public.birthday_valid_photos(photos)),
  pending_upload boolean not null default false,
  contributed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create or replace function public.birthday_stamp_response()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.event_id is distinct from old.event_id or new.user_id is distinct from old.user_id then
      raise exception 'A response cannot change its event or owner.' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
    if new.pending_upload then
      new.contributed_at := null;
    elsif old.pending_upload
      or new.story is distinct from old.story
      or new.photos is distinct from old.photos
      or new.contributed_at is distinct from old.contributed_at then
      new.contributed_at := pg_catalog.statement_timestamp();
    else
      new.contributed_at := old.contributed_at;
    end if;
  else
    new.created_at := pg_catalog.statement_timestamp();
    new.contributed_at := case when not new.pending_upload and
      (new.contributed_at is not null or new.story <> '' or new.photos <> '[]'::jsonb)
      then pg_catalog.statement_timestamp() else null end;
  end if;
  new.updated_at := pg_catalog.statement_timestamp();
  return new;
end;
$$;

drop trigger if exists birthday_response_timestamps on public.birthday_responses;
create trigger birthday_response_timestamps before insert or update on public.birthday_responses
for each row execute function public.birthday_stamp_response();

create or replace function public.birthday_is_organiser(event_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.birthday_organisers o
    where o.event_id = $1 and o.user_id = (select auth.uid())
  );
$$;

alter table public.birthday_events enable row level security;
alter table public.birthday_organisers enable row level security;
alter table public.birthday_responses enable row level security;

revoke all on public.birthday_events, public.birthday_organisers, public.birthday_responses from public, anon, authenticated;
grant select on public.birthday_events, public.birthday_organisers to authenticated;
grant select, insert, update, delete on public.birthday_responses to authenticated;
revoke all on function public.birthday_valid_photos(jsonb), public.birthday_stamp_response(), public.birthday_is_organiser(text) from public, anon, authenticated;
grant execute on function public.birthday_valid_photos(jsonb), public.birthday_is_organiser(text) to authenticated;

drop policy if exists birthday_events_read on public.birthday_events;
create policy birthday_events_read on public.birthday_events for select to authenticated using (true);
drop policy if exists birthday_organisers_read_self on public.birthday_organisers;
create policy birthday_organisers_read_self on public.birthday_organisers for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists birthday_responses_read on public.birthday_responses;
create policy birthday_responses_read on public.birthday_responses for select to authenticated
using (user_id = (select auth.uid()) or public.birthday_is_organiser(event_id));
drop policy if exists birthday_responses_insert on public.birthday_responses;
create policy birthday_responses_insert on public.birthday_responses for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.birthday_events e where e.id = event_id and e.is_open
));
drop policy if exists birthday_responses_update on public.birthday_responses;
create policy birthday_responses_update on public.birthday_responses for update to authenticated
using (user_id = (select auth.uid()) and exists (
  select 1 from public.birthday_events e where e.id = event_id and e.is_open
))
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.birthday_events e where e.id = event_id and e.is_open
));
drop policy if exists birthday_responses_delete on public.birthday_responses;
create policy birthday_responses_delete on public.birthday_responses for delete to authenticated
using (public.birthday_is_organiser(event_id));

insert into public.birthday_events (id, is_open) values ('sara-30-2026', true)
on conflict (id) do nothing;

-- Create the organiser's auth account first, then grant it access with SQL:
-- insert into public.birthday_organisers(event_id,user_id)
-- values ('sara-30-2026','ACCOUNT-UUID-FROM-SUPABASE-AUTH');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('birthday-memories', 'birthday-memories', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Accept exactly EVENT/USER_UUID/SLOT. Fixed slots cap each guest at 3 objects.
-- There must already be a response: uploads cannot create orphan paths.
create or replace function public.birthday_storage_access(object_name text, operation text)
returns boolean language sql stable set search_path = '' as $$
  select $1 ~ '^[a-z0-9][a-z0-9-]{0,63}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[123]$'
    and exists (
      select 1 from public.birthday_responses r
      join public.birthday_events e on e.id = r.event_id
      where r.event_id = pg_catalog.split_part($1, '/', 1)
        and r.user_id::text = pg_catalog.split_part($1, '/', 2)
        and case $2
          when 'write' then r.user_id = (select auth.uid()) and r.pending_upload and e.is_open
          when 'read' then r.user_id = (select auth.uid()) or public.birthday_is_organiser(r.event_id)
          when 'delete' then r.user_id = (select auth.uid()) or public.birthday_is_organiser(r.event_id)
          else false
        end
    );
$$;
revoke all on function public.birthday_storage_access(text,text) from public, anon, authenticated;
grant execute on function public.birthday_storage_access(text,text) to authenticated;

drop policy if exists birthday_memories_read on storage.objects;
create policy birthday_memories_read on storage.objects for select to authenticated
using (bucket_id = 'birthday-memories' and public.birthday_storage_access(name, 'read'));
drop policy if exists birthday_memories_insert on storage.objects;
create policy birthday_memories_insert on storage.objects for insert to authenticated
with check (bucket_id = 'birthday-memories' and public.birthday_storage_access(name, 'write'));
drop policy if exists birthday_memories_update on storage.objects;
create policy birthday_memories_update on storage.objects for update to authenticated
using (bucket_id = 'birthday-memories' and public.birthday_storage_access(name, 'write'))
with check (bucket_id = 'birthday-memories' and public.birthday_storage_access(name, 'write'));
drop policy if exists birthday_memories_delete on storage.objects;
create policy birthday_memories_delete on storage.objects for delete to authenticated
using (bucket_id = 'birthday-memories' and public.birthday_storage_access(name, 'delete'));

commit;
