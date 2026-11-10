-- Run in a disposable Supabase test project SQL editor. Entire fixture rolls back.
-- Not yet executed in this development environment: no database connection was supplied.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','adult-a@example.invalid','{"username":"test_adult_a"}'),
 ('22222222-2222-4222-8222-222222222222','child-b@example.invalid','{"username":"test_child_b"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('test.household',public.create_household('Permission test')::text,true);
select set_config('test.invite',public.create_invite(current_setting('test.household')::uuid,'child'),true);
select public.apply_record('{"id":"33333333-3333-4333-8333-333333333333","owner_id":"11111111-1111-4111-8111-111111111111","kind":"expense","title":"Private adult expense","amount":12345,"currency":"EGP","status":"paid","date":"2026-11-10","deleted":false,"notes":"PRIVATE","category":"Other","version":0,"updated_at":"2026-11-10T00:00:00Z","household_id":null,"interval":"none","wallet_id":"main","destination_wallet_id":"","progress":0}',0);
do $$begin if (select count(*) from public.records)<>1 then raise exception 'Owner cannot read own record';end if;end$$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select public.accept_invite(current_setting('test.invite'));
do $$begin
 if (select count(*) from public.records)<>0 then raise exception 'Child can read adult private data';end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Profile enumeration possible';end if;
 begin perform public.accept_invite(current_setting('test.invite'));raise exception 'Replay accepted';exception when raise_exception then if sqlerrm='Replay accepted' then raise;end if;end;
 begin perform public.create_invite(current_setting('test.household')::uuid,'adult');raise exception 'Child invited adult';exception when raise_exception then if sqlerrm='Child invited adult' then raise;end if;end;
 begin perform public.apply_record('{"id":"33333333-3333-4333-8333-333333333333","owner_id":"11111111-1111-4111-8111-111111111111","kind":"expense","title":"Attack","amount":1,"currency":"EGP","status":"paid"}',1);raise exception 'Foreign write accepted';exception when raise_exception then if sqlerrm='Foreign write accepted' then raise;end if;end;
end$$;
reset role;
rollback;
