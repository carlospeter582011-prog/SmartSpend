-- Synthetic identity tests; no email is sent and all rows are rolled back.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('61111111-1111-4111-8111-111111111111','identity-a@example.invalid','{"username":"identity_one","real_name":"Fixture Person"}'),
 ('62222222-2222-4222-8222-222222222222','identity-b@example.invalid','{"username":"identity_two","real_name":"Fixture Person"}');
do $$begin
 if (select real_name from public.profiles where id='61111111-1111-4111-8111-111111111111')<>'Fixture Person' then raise exception 'Real name not captured';end if;
 begin
  insert into auth.users(id,email,raw_user_meta_data) values('63333333-3333-4333-8333-333333333333','duplicate@example.invalid','{"username":"IDENTITY_ONE","real_name":"Other Person"}');
  raise exception 'Duplicate username accepted';
 exception when unique_violation then null;end;
 begin
  insert into auth.users(id,email,raw_user_meta_data) values('64444444-4444-4444-8444-444444444444','missing@example.invalid','{"username":"identity_missing"}');
  raise exception 'Missing real name accepted';
 exception when check_violation then null;end;
 begin
  insert into auth.users(id,email,raw_user_meta_data) values('65555555-5555-4555-8555-555555555555','invalid@example.invalid','{"username":"invalid%name","real_name":"Valid Name"}');
  raise exception 'Invalid username accepted';
 exception when check_violation then null;end;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','61111111-1111-4111-8111-111111111111',true);
do $$begin
 if (select count(*) from public.profiles)<>1 then raise exception 'Identity privacy leak';end if;
 begin update public.profiles set username='IDENTITY_TWO' where id=auth.uid();raise exception 'Duplicate username update accepted';exception when unique_violation then null;end;
 update public.profiles set real_name='Updated Fixture Name' where id=auth.uid();
 if (select real_name from public.profiles where id=auth.uid())<>'Updated Fixture Name' then raise exception 'Own name update failed';end if;
 update public.profiles set real_name='Foreign update' where id='62222222-2222-4222-8222-222222222222';
 if found then raise exception 'Foreign identity update accepted';end if;
end$$;
reset role;
set local role anon;
do $$begin if (select count(*) from public.profiles)<>0 then raise exception 'Anonymous identity enumeration';end if;end$$;
reset role;
rollback;
