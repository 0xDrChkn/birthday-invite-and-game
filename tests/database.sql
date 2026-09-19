-- Run against a disposable Supabase database AFTER backend/schema.sql:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql
-- All fixtures and helper functions are rolled back, including auth/storage rows.
begin;

-- Current Supabase Storage prevents direct SQL deletes even when RLS allows
-- them. Emulate its API's transaction setting for these rolled-back fixtures;
-- this does not bypass the row policies being tested.
set local storage.allow_delete_query = 'true';

create function pg_temp.assert_true(result boolean, label text)
returns void language plpgsql as $$
begin
  if result is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end;
$$;

create function pg_temp.expect_rejected(statement text, label text)
returns void language plpgsql as $$
declare rejected boolean := false;
begin
  begin
    execute statement;
  exception when insufficient_privilege or check_violation or not_null_violation then
    rejected := true;
  end;
  perform pg_temp.assert_true(rejected, label);
end;
$$;

insert into auth.users (id, aud, role, email) values
 ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'birthday-test-a@example.invalid'),
 ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'birthday-test-b@example.invalid'),
 ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'birthday-test-host@example.invalid');
insert into public.birthday_events (id, is_open) values
 ('birthday-test-open', true), ('birthday-test-closed', false), ('birthday-test-other', true);
insert into public.birthday_organisers (event_id, user_id) values
 ('birthday-test-open', '33333333-3333-4333-8333-333333333333');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select pg_temp.assert_true((select count(*) = 3 from public.birthday_events where id like 'birthday-test-%'), 'signed-in guests can read event availability');
insert into public.birthday_responses(event_id,user_id,name,accepted,created_at,updated_at)
values ('birthday-test-open',auth.uid(),'Guest A',true,'2000-01-01','2000-01-01');
select pg_temp.assert_true((select created_at > '2000-01-02' and updated_at > '2000-01-02' and contributed_at is null from public.birthday_responses where event_id='birthday-test-open'), 'server timestamps override submitted times; RSVP is not a contribution');
select pg_temp.assert_true(not public.birthday_is_organiser('birthday-test-open'), 'guest cannot claim organiser access');
select pg_temp.expect_rejected($q$insert into public.birthday_organisers values ('birthday-test-open',auth.uid())$q$, 'guest cannot grant organiser rights');
select pg_temp.expect_rejected($q$update public.birthday_events set is_open=true where id='birthday-test-closed'$q$, 'guest cannot reopen an event');
select pg_temp.expect_rejected($q$insert into public.birthday_responses(event_id,user_id,name,accepted) values ('birthday-test-closed',auth.uid(),'Guest A',true)$q$, 'closed event rejects new RSVP');
select pg_temp.expect_rejected($q$insert into public.birthday_responses(event_id,user_id,name,accepted) values ('birthday-test-other','22222222-2222-4222-8222-222222222222','Impersonation',true)$q$, 'guest cannot insert another owner');
select pg_temp.expect_rejected($q$update public.birthday_responses set user_id='22222222-2222-4222-8222-222222222222' where event_id='birthday-test-open'$q$, 'response owner is immutable');
select pg_temp.expect_rejected($q$update public.birthday_responses set event_id='birthday-test-other' where event_id='birthday-test-open'$q$, 'response event is immutable');
select pg_temp.expect_rejected($q$update public.birthday_responses set name='  ' where event_id='birthday-test-open'$q$, 'empty name rejected');
select pg_temp.expect_rejected($q$update public.birthday_responses set name=' Guest A ' where event_id='birthday-test-open'$q$, 'untrimmed name rejected');
select pg_temp.expect_rejected($q$update public.birthday_responses set name=repeat('x',121) where event_id='birthday-test-open'$q$, 'oversized name rejected');
select pg_temp.expect_rejected($q$update public.birthday_responses set story=repeat('x',3001) where event_id='birthday-test-open'$q$, 'oversized story rejected');

do $$
declare invalid jsonb;
begin
  for invalid in select value from jsonb_array_elements('[
    {}, null, [null],
    [{"slot":1,"name":"photo.jpg","size":1,"type":"image/jpeg","path":"someone-else/1"}],
    [{"slot":1,"name":"photo.jpg","size":1,"type":"image/jpeg"},{"slot":1,"name":"other.jpg","size":1,"type":"image/jpeg"}],
    [{"slot":4,"name":"photo.jpg","size":1,"type":"image/jpeg"}],
    [{"slot":"1","name":"photo.jpg","size":1,"type":"image/jpeg"}],
    [{"slot":1,"name":" ","size":1,"type":"image/jpeg"}],
    [{"slot":1,"name":null,"size":1,"type":"image/jpeg"}],
    [{"slot":1,"name":"photo.jpg","size":20971521,"type":"image/jpeg"}],
    [{"slot":1,"name":"photo.jpg","size":0,"type":"image/jpeg"}],
    [{"slot":1,"name":"photo.jpg","size":1.5,"type":"image/jpeg"}],
    [{"slot":1,"name":"photo.jpg","size":"10","type":"image/jpeg"}],
    [{"slot":1,"name":"photo.svg","size":1,"type":"image/svg+xml"}],
    [{"slot":1,"name":"photo.jpg","size":1}],
    [{"slot":1,"name":"a","size":1,"type":"image/jpeg"},{"slot":2,"name":"b","size":1,"type":"image/png"},{"slot":3,"name":"c","size":1,"type":"image/webp"},{"slot":4,"name":"d","size":1,"type":"image/heic"}]
  ]'::jsonb) loop
    perform pg_temp.expect_rejected(format('update public.birthday_responses set photos=%L::jsonb where event_id=''birthday-test-open''', invalid), 'invalid manifest: ' || coalesce(invalid::text,'SQL NULL'));
  end loop;
end;
$$;

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
insert into public.birthday_responses(event_id,user_id,name,accepted,pending_upload)
values ('birthday-test-open',auth.uid(),'Guest B',false,true);
insert into storage.objects(bucket_id,name,metadata)
values ('birthday-memories','birthday-test-open/22222222-2222-4222-8222-222222222222/1','{"mimetype":"image/jpeg","size":10}');

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select pg_temp.assert_true((select count(*)=1 from public.birthday_responses where event_id='birthday-test-open'), 'guest reads only their own response');
select pg_temp.assert_true((select count(*)=0 from public.birthday_organisers where event_id='birthday-test-open'), 'organiser account is not disclosed to guests');
with changed as (update public.birthday_responses set name='Hacked' where user_id='22222222-2222-4222-8222-222222222222' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'cross-guest update affects no rows');
with removed as (delete from public.birthday_responses where event_id='birthday-test-open' returning *)
select pg_temp.assert_true((select count(*)=0 from removed), 'guest cannot delete responses');
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='birthday-memories' and name like 'birthday-test-open/%'), 'guest cannot read another guest photo');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-open/11111111-1111-4111-8111-111111111111/1')$q$, 'uploads require an active pending upload');

update public.birthday_responses set pending_upload=true where event_id='birthday-test-open';
insert into storage.objects(bucket_id,name,metadata)
select 'birthday-memories','birthday-test-open/11111111-1111-4111-8111-111111111111/' || slot,'{"mimetype":"image/jpeg","size":10}'::jsonb from generate_series(1,3) as slot;
select pg_temp.assert_true((select count(*)=3 from storage.objects where bucket_id='birthday-memories' and name like 'birthday-test-open/%'), 'guest uploads and reads own three fixed slots');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-open/11111111-1111-4111-8111-111111111111/4')$q$, 'fourth storage slot rejected');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-open/11111111-1111-4111-8111-111111111111/1.jpg')$q$, 'storage path extensions rejected');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-open/22222222-2222-4222-8222-222222222222/2')$q$, 'cross-guest storage insert rejected');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-other/11111111-1111-4111-8111-111111111111/1')$q$, 'storage path without a response rejected');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-open/11111111-1111-4111-8111-111111111111/../2')$q$, 'path traversal rejected');
with changed as (update storage.objects set metadata='{"changed":true}' where name='birthday-test-open/22222222-2222-4222-8222-222222222222/1' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'cross-guest storage update affects no rows');
with removed as (delete from storage.objects where name='birthday-test-open/22222222-2222-4222-8222-222222222222/1' returning *)
select pg_temp.assert_true((select count(*)=0 from removed), 'cross-guest storage delete affects no rows');

update public.birthday_responses set story='An affectionate memory.',photos='[{"slot":1,"name":"photo.jpg","size":10,"type":"image/jpeg"}]',pending_upload=false,contributed_at='2000-01-01' where event_id='birthday-test-open';
select pg_temp.assert_true((select contributed_at>'2000-01-02' and not pending_upload from public.birthday_responses where event_id='birthday-test-open'), 'finalisation uses server contribution time');
with changed as (update storage.objects set metadata='{"changed":true}' where name='birthday-test-open/11111111-1111-4111-8111-111111111111/1' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'completed contribution cannot overwrite photos without pending state');
update public.birthday_responses set pending_upload=true where event_id='birthday-test-open';
select pg_temp.assert_true((select contributed_at is null and pending_upload from public.birthday_responses where event_id='birthday-test-open'), 'incomplete replacement is not marked as a completed contribution');

reset role;
update public.birthday_events set is_open=false where id='birthday-test-open';
set local role authenticated;
with changed as (update public.birthday_responses set name='Changed after closing' where event_id='birthday-test-open' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'closed event rejects response changes');
with changed as (update storage.objects set metadata='{"changed":true}' where name='birthday-test-open/11111111-1111-4111-8111-111111111111/1' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'closed event rejects photo replacement');
delete from storage.objects where name='birthday-test-open/11111111-1111-4111-8111-111111111111/3';
select pg_temp.assert_true((select count(*)=2 from storage.objects where name like 'birthday-test-open/11111111-1111-4111-8111-111111111111/%'), 'owner can clean up photos after event closure');

reset role;
update public.birthday_events set is_open=true where id='birthday-test-open';
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select pg_temp.assert_true(public.birthday_is_organiser('birthday-test-open') and not public.birthday_is_organiser('birthday-test-other'), 'organiser access is event scoped');
select pg_temp.assert_true((select count(*)=2 from public.birthday_responses where event_id='birthday-test-open'), 'organiser can read both RSVPs');
select pg_temp.assert_true((select count(*)=3 from storage.objects where bucket_id='birthday-memories' and name like 'birthday-test-open/%'), 'organiser can read guest photos');
with changed as (update public.birthday_responses set name='Host overwrite' where event_id='birthday-test-open' returning *)
select pg_temp.assert_true((select count(*)=0 from changed), 'organiser cannot impersonate a guest by editing their response');
delete from storage.objects where bucket_id='birthday-memories' and name like 'birthday-test-open/%';
select pg_temp.assert_true((select count(*)=0 from storage.objects where bucket_id='birthday-memories' and name like 'birthday-test-open/%'), 'organiser can remove event photos');
delete from public.birthday_responses where event_id='birthday-test-open';
select pg_temp.assert_true((select count(*)=0 from public.birthday_responses where event_id='birthday-test-open'), 'organiser can remove event responses');

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"anon"}';
select pg_temp.expect_rejected($q$select * from public.birthday_events$q$, 'unsigned visitors cannot read event table');
select pg_temp.expect_rejected($q$select * from public.birthday_responses$q$, 'unsigned visitors cannot read responses');
select pg_temp.expect_rejected($q$insert into public.birthday_responses(event_id,user_id,name,accepted) values ('birthday-test-other','11111111-1111-4111-8111-111111111111','Unsigned',true)$q$, 'unsigned visitors cannot submit');
select pg_temp.expect_rejected($q$select public.birthday_is_organiser('birthday-test-open')$q$, 'unsigned visitors cannot call organiser helper');
select pg_temp.expect_rejected($q$insert into storage.objects(bucket_id,name) values ('birthday-memories','birthday-test-other/11111111-1111-4111-8111-111111111111/1')$q$, 'unsigned visitors cannot upload');

reset role;
select pg_temp.assert_true((select not public and file_size_limit=20971520 and cardinality(allowed_mime_types)=5 from storage.buckets where id='birthday-memories'), 'private bucket enforces 20 MiB and five image MIME types');
rollback;
