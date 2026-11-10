-- Run in a disposable Supabase test project SQL editor. Entire fixture rolls back.
-- CI runs against isolated PostgreSQL role/auth fixtures; live Supabase Auth remains separate.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','adult-a@example.invalid','{"username":"test_adult_a","real_name":"Fixture Adult"}'),
 ('22222222-2222-4222-8222-222222222222','child-b@example.invalid','{"username":"test_child_b","real_name":"Fixture Child"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('test.household',public.create_household('Permission test')::text,true);
select set_config('test.expired',public.create_invite(current_setting('test.household')::uuid,'guest'),true);
select set_config('test.revoked',public.create_invite(current_setting('test.household')::uuid,'guest'),true);
select set_config('test.invite',public.create_invite(current_setting('test.household')::uuid,'child'),true);
select public.apply_record('{"id":"33333333-3333-4333-8333-333333333333","owner_id":"11111111-1111-4111-8111-111111111111","kind":"expense","title":"Private adult expense","amount":12345,"currency":"EGP","status":"paid","date":"2026-11-10","deleted":false,"notes":"PRIVATE","category":"Other","version":0,"updated_at":"2026-11-10T00:00:00Z","household_id":null,"interval":"none","wallet_id":"main","destination_wallet_id":"","progress":0}',0);
do $$begin if (select count(*) from public.records)<>1 then raise exception 'Owner cannot read own record';end if;end$$;
do $$declare payload jsonb;result jsonb;begin
 select r.payload into payload from public.records r limit 1;
 result:=public.apply_record(payload,0);
 if (result->>'conflict')::boolean or (result->'record'->>'version')::int<>1 then raise exception 'Replay was not idempotent';end if;
 result:=public.apply_record(payload||'{"title":"Changed stale record"}'::jsonb,0);
 if not (result->>'conflict')::boolean then raise exception 'Stale write did not conflict';end if;
end$$;
insert into public.transaction_shares(record_id,household_id,owner_id,title,amount,currency,date,kind) values('33333333-3333-4333-8333-333333333333',current_setting('test.household')::uuid,auth.uid(),'Explicit shared snapshot',100,'EGP','2026-11-10','expense');
reset role;
update public.invitations set expires_at=now()-interval '1 second' where token_hash=encode(extensions.digest(current_setting('test.expired'),'sha256'),'hex');
update public.invitations set revoked=true where token_hash=encode(extensions.digest(current_setting('test.revoked'),'sha256'),'hex');
set local role authenticated;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select public.accept_invite(current_setting('test.invite'));
do $$begin
 if (select count(*) from public.records)<>0 then raise exception 'Child can read adult private data';end if;
 if (select count(*) from public.transactions)<>0 then raise exception 'Domain view leaked private rows';end if;
 if (select count(*) from public.transaction_shares)<>1 then raise exception 'Explicit share unavailable to family';end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Profile enumeration possible';end if;
 begin perform public.accept_invite(current_setting('test.invite'));raise exception 'Replay accepted';exception when raise_exception then if sqlerrm='Replay accepted' then raise;end if;end;
 begin perform public.create_invite(current_setting('test.household')::uuid,'adult');raise exception 'Child invited adult';exception when raise_exception then if sqlerrm='Child invited adult' then raise;end if;end;
 begin perform public.apply_record('{"id":"33333333-3333-4333-8333-333333333333","owner_id":"11111111-1111-4111-8111-111111111111","kind":"expense","title":"Attack","amount":1,"currency":"EGP","status":"paid"}',1);raise exception 'Foreign write accepted';exception when raise_exception then if sqlerrm='Foreign write accepted' then raise;end if;end;
 begin perform public.accept_invite(current_setting('test.expired'));raise exception 'Expired invite accepted';exception when raise_exception then if sqlerrm='Expired invite accepted' then raise;end if;end;
 begin perform public.accept_invite(current_setting('test.revoked'));raise exception 'Revoked invite accepted';exception when raise_exception then if sqlerrm='Revoked invite accepted' then raise;end if;end;
 begin perform public.manage_member(current_setting('test.household')::uuid,auth.uid(),'admin');raise exception 'Child escalated privileges';exception when raise_exception then if sqlerrm='Child escalated privileges' then raise;end if;end;
 begin insert into public.records(id,owner_id,payload) values(gen_random_uuid(),auth.uid(),'{}');raise exception 'Direct mutation bypassed CAS';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
 if (select count(*) from public.records)<>0 then raise exception 'Anonymous record leak';end if;
 begin perform public.consume_quota('attack',100,60);raise exception 'Anonymous quota bypass';exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
