-- SmartSpend: initial setup for a NEW, EMPTY Supabase project.
-- Paste the entire file into Supabase SQL Editor and Run ONCE.
-- Do not run if migrations 001-004 were already applied.
-- Never run supabase/tests/bootstrap.sql in Supabase.
-- No keys or passwords belong in this script.

BEGIN;

-- Source migration: 001_smartspend.sql
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public.profiles(id uuid primary key references auth.users on delete cascade, username text not null check(username ~ '^[A-Za-z0-9_]{3,30}$'), settings jsonb not null default '{}');
create unique index profiles_username_ci on public.profiles(lower(username));
create function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,username) values(new.id,new.raw_user_meta_data->>'username'); return new; end $$;
create trigger create_profile after insert on auth.users for each row execute function public.new_profile();
alter table public.profiles enable row level security;
create policy own_profile_read on public.profiles for select to authenticated using(id=auth.uid());
create policy own_profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create table public.households(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 100),created_by uuid not null references auth.users on delete cascade);
create table public.household_members(household_id uuid references public.households on delete cascade,user_id uuid references auth.users on delete cascade,role text not null check(role in ('admin','adult','child','guest')),primary key(household_id,user_id));
create function public.is_member(h uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.household_members where household_id=h and user_id=auth.uid())$$;
create function public.is_admin(h uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.household_members where household_id=h and user_id=auth.uid() and role='admin')$$;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
create policy household_read on public.households for select to authenticated using(public.is_member(id));
create policy members_read on public.household_members for select to authenticated using(public.is_member(household_id));
create function public.create_household(p_name text) returns uuid language plpgsql security definer set search_path='' as $$declare h uuid;begin if auth.uid() is null then raise exception 'Unauthorized';end if;insert into public.households(name,created_by) values(p_name,auth.uid()) returning id into h;insert into public.household_members values(h,auth.uid(),'admin');return h;end$$;
create table public.invitations(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,token_hash text unique not null,role text not null check(role in ('adult','child','guest')),expires_at timestamptz not null,used_by uuid references auth.users on delete set null,revoked boolean not null default false);
alter table public.invitations enable row level security;
create policy invite_admin_read on public.invitations for select to authenticated using(public.is_admin(household_id));
create policy invite_revoke on public.invitations for update to authenticated using(public.is_admin(household_id)) with check(public.is_admin(household_id));
-- Only revocation may be changed directly; tokens, roles and expiry are immutable to clients.
revoke update on public.invitations from authenticated;
grant update(revoked) on public.invitations to authenticated;
create function public.create_invite(h uuid,p_role text) returns text language plpgsql security definer set search_path='' as $$declare token text;begin if not public.is_admin(h) then raise exception 'Forbidden';end if;token:=encode(extensions.gen_random_bytes(32),'hex');insert into public.invitations(household_id,token_hash,role,expires_at) values(h,encode(extensions.digest(token,'sha256'),'hex'),p_role,now()+interval '48 hours');return token;end$$;
create function public.accept_invite(token text) returns uuid language plpgsql security definer set search_path='' as $$declare inv public.invitations;begin if auth.uid() is null then raise exception 'Unauthorized';end if;select * into inv from public.invitations where token_hash=encode(extensions.digest(token,'sha256'),'hex') for update;if inv.id is null or inv.revoked or inv.used_by is not null or inv.expires_at<=now() then raise exception 'Invalid or expired invitation';end if;insert into public.household_members values(inv.household_id,auth.uid(),inv.role);update public.invitations set used_by=auth.uid() where id=inv.id;return inv.household_id;end$$;
create table public.records(id uuid primary key,owner_id uuid not null references auth.users on delete cascade,version integer not null default 1,payload jsonb not null,updated_at timestamptz not null default now());
alter table public.records enable row level security;
create policy records_private on public.records for select to authenticated using(owner_id=auth.uid());
-- Mutations only through CAS RPC. Version checks and owner validation cannot be bypassed via REST.
revoke insert,update,delete on public.records from authenticated,anon;
create function public.apply_record(p_record jsonb,p_base_version int) returns jsonb language plpgsql security definer set search_path='' as $$declare cur public.records;v int;out_record jsonb;begin
 if auth.uid() is null or p_record->>'owner_id'<>auth.uid()::text then raise exception 'Unauthorized';end if;
 if p_record->>'kind' not in ('income','expense','transfer','bill','budget','goal','debt','category','wallet','recurring') or jsonb_typeof(p_record->'amount')<>'number' or (p_record->>'amount')::numeric<0 or (p_record->>'amount')::numeric>9007199254740991 or (p_record->>'amount')::numeric<>trunc((p_record->>'amount')::numeric) or length(p_record->>'title') not between 1 and 140 or p_record->>'status' not in ('planned','paid','canceled') or p_record->>'currency' !~ '^[A-Z]{3}$' then raise exception 'Invalid record';end if;
 if not(p_record ?& array['id','owner_id','kind','title','amount','currency','category','date','status','notes','version','updated_at','deleted','household_id','interval','wallet_id','destination_wallet_id','progress']) or jsonb_typeof(p_record->'deleted')<>'boolean' or length(p_record->>'notes')>2000 or length(p_record->>'category')>60 or p_record->>'interval' not in ('none','weekly','monthly','yearly') or (p_record->>'progress')::numeric<0 or (p_record->>'progress')::numeric>9007199254740991 or (p_record->>'progress')::numeric<>trunc((p_record->>'progress')::numeric) then raise exception 'Invalid payload';end if;
 perform (p_record->>'date')::date;perform (p_record->>'updated_at')::timestamptz;
 perform pg_advisory_xact_lock(hashtextextended(p_record->>'id',0));
 select * into cur from public.records where id=(p_record->>'id')::uuid for update;
 if cur.id is not null and cur.owner_id<>auth.uid() then raise exception 'Forbidden';end if;
 if cur.id is not null and cur.version<>p_base_version then
   if cur.payload - 'version' - 'updated_at' = p_record - 'version' - 'updated_at' then return jsonb_build_object('conflict',false,'record',cur.payload);end if;
   return jsonb_build_object('conflict',true,'record',cur.payload);
 end if;
 if cur.id is null and p_base_version<>0 then raise exception 'Missing record';end if;
 v:=coalesce(cur.version,0)+1;out_record:=p_record||jsonb_build_object('version',v,'household_id',null);
 insert into public.records(id,owner_id,version,payload) values((p_record->>'id')::uuid,auth.uid(),v,out_record) on conflict(id) do update set version=v,payload=out_record,updated_at=now();insert into public.sync_operations(owner_id,action) values(auth.uid(),case when (p_record->>'deleted')::boolean then 'record_deleted' else 'record_saved' end);return jsonb_build_object('conflict',false,'record',out_record);end$$;
-- Sharing is a deliberate snapshot: recipient cannot fetch the private source row or private notes.
create table public.transaction_shares(record_id uuid references public.records on delete cascade,household_id uuid references public.households on delete cascade,owner_id uuid not null references auth.users on delete cascade,title text not null,amount bigint not null check(amount>=0 and amount<=9007199254740991),currency text not null,date date not null,kind text not null check(kind in ('income','expense','bill')),primary key(record_id,household_id));
alter table public.transaction_shares enable row level security;
create policy shares_read on public.transaction_shares for select to authenticated using(public.is_member(household_id));
create policy shares_insert on public.transaction_shares for insert to authenticated with check(owner_id=auth.uid() and public.is_member(household_id) and exists(select 1 from public.records r where r.id=record_id and r.owner_id=auth.uid() and (r.payload->>'deleted')::boolean=false) and exists(select 1 from public.household_members m where m.household_id=transaction_shares.household_id and m.user_id=auth.uid() and m.role in ('admin','adult')));
create policy shares_delete on public.transaction_shares for delete to authenticated using(owner_id=auth.uid() or public.is_admin(household_id));
create table public.ai_reports(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users on delete cascade,fingerprint text not null,result jsonb not null,created_at timestamptz not null default now(),unique(owner_id,fingerprint));
alter table public.ai_reports enable row level security;
create policy ai_own on public.ai_reports for select to authenticated using(owner_id=auth.uid());
create table public.rate_buckets(bucket text primary key,count int not null,reset_at timestamptz not null);
alter table public.rate_buckets enable row level security;
create function public.consume_quota(p_bucket text,p_limit int,p_seconds int) returns boolean language plpgsql security definer set search_path='' as $$declare n int;begin insert into public.rate_buckets values(p_bucket,1,now()+make_interval(secs=>p_seconds)) on conflict(bucket) do update set count=case when public.rate_buckets.reset_at<=now() then 1 else public.rate_buckets.count+1 end,reset_at=case when public.rate_buckets.reset_at<=now() then now()+make_interval(secs=>p_seconds) else public.rate_buckets.reset_at end returning count into n;return n<=p_limit;end$$;
revoke all on function public.consume_quota(text,int,int) from public,anon,authenticated;
grant execute on function public.consume_quota(text,int,int) to service_role;
create table public.sync_operations(id uuid primary key default gen_random_uuid(),owner_id uuid references auth.users on delete cascade,action text not null,created_at timestamptz not null default now());
alter table public.sync_operations enable row level security;
create policy audit_own on public.sync_operations for select to authenticated using(owner_id=auth.uid());
-- No public access to privileged mutations.
revoke execute on function public.new_profile() from public,anon,authenticated;
revoke execute on function public.create_household(text),public.create_invite(uuid,text),public.accept_invite(text),public.apply_record(jsonb,int) from public,anon;
grant execute on function public.create_household(text),public.create_invite(uuid,text),public.accept_invite(text),public.apply_record(jsonb,int) to authenticated;

-- Source migration: 002_family_management.sql
alter table public.transaction_shares add column status text not null default 'paid' check(status in ('planned','paid','canceled'));
create function public.manage_member(h uuid,target uuid,new_role text) returns void language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtextextended(h::text,1));
 if not public.is_admin(h) then raise exception 'Forbidden';end if;
 if exists(select 1 from public.household_members where household_id=h and user_id=target and role='admin') and new_role<>'admin' and (select count(*) from public.household_members where household_id=h and role='admin')<=1 then raise exception 'Last admin cannot be removed';end if;
 if new_role='remove' then delete from public.household_members where household_id=h and user_id=target;
 elsif new_role in ('admin','adult','child','guest') then update public.household_members set role=new_role where household_id=h and user_id=target;
 else raise exception 'Invalid role';end if;
end$$;
revoke execute on function public.manage_member(uuid,uuid,text) from public,anon;
grant execute on function public.manage_member(uuid,uuid,text) to authenticated;
create table public.household_budgets(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,title text not null check(length(title) between 1 and 140),amount bigint not null check(amount between 0 and 9007199254740991),currency text not null check(currency ~ '^[A-Z]{3}$'),month date not null);
alter table public.household_budgets enable row level security;
create policy budget_read on public.household_budgets for select to authenticated using(public.is_member(household_id));
create policy budget_manage on public.household_budgets for all to authenticated using(public.is_admin(household_id)) with check(public.is_admin(household_id));
create table public.shared_bill_assignments(record_id uuid not null,household_id uuid not null,assignee uuid not null references auth.users on delete cascade,status text not null default 'planned' check(status in ('planned','paid','canceled')),primary key(record_id,household_id),foreign key(record_id,household_id) references public.transaction_shares(record_id,household_id) on delete cascade,foreign key(household_id,assignee) references public.household_members(household_id,user_id) on delete cascade);
alter table public.shared_bill_assignments enable row level security;
create policy assignment_read on public.shared_bill_assignments for select to authenticated using(public.is_member(household_id));
create policy assignment_create on public.shared_bill_assignments for insert to authenticated with check(public.is_admin(household_id) and exists(select 1 from public.transaction_shares s where s.record_id=shared_bill_assignments.record_id and s.household_id=shared_bill_assignments.household_id and s.kind='bill'));
create policy assignment_update on public.shared_bill_assignments for update to authenticated using(public.is_member(household_id) and (assignee=auth.uid() or public.is_admin(household_id))) with check(public.is_member(household_id) and (assignee=auth.uid() or public.is_admin(household_id)));
revoke update on public.shared_bill_assignments from authenticated;
grant update(status) on public.shared_bill_assignments to authenticated;

-- Source migration: 003_domain_views.sql
-- Typed logical domain views retain the single versioned sync store and inherit its RLS.
-- PostgreSQL 15+ security_invoker prevents view-owner bypass of private records.
create view public.transactions with (security_invoker=true) as select id,owner_id,version,(payload->>'amount')::bigint as amount,payload->>'currency' as currency,payload->>'kind' as kind,payload->>'title' as title,(payload->>'date')::date as date,payload->>'status' as status,payload->>'category' as category,payload->>'wallet_id' as wallet_id,payload->>'destination_wallet_id' as destination_wallet_id,payload->>'notes' as notes,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind' in ('income','expense','transfer');
create view public.wallets with (security_invoker=true) as select id,owner_id,version,payload->>'title' as name,payload->>'currency' as currency,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='wallet';
create view public.categories with (security_invoker=true) as select id,owner_id,version,payload->>'title' as name,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='category';
create view public.budgets with (security_invoker=true) as select id,owner_id,version,payload->>'title' as title,(payload->>'amount')::bigint as amount,payload->>'currency' as currency,payload->>'category' as category,(payload->>'date')::date as date,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='budget';
create view public.bills with (security_invoker=true) as select id,owner_id,version,payload->>'title' as title,(payload->>'amount')::bigint as amount,payload->>'currency' as currency,(payload->>'date')::date as due_date,payload->>'status' as status,payload->>'interval' as recurrence,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='bill';
create view public.recurring_rules with (security_invoker=true) as select id,owner_id,version,payload->>'title' as title,(payload->>'amount')::bigint as amount,payload->>'currency' as currency,(payload->>'date')::date as start_date,payload->>'interval' as recurrence,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='recurring';
create view public.goals with (security_invoker=true) as select id,owner_id,version,payload->>'title' as title,(payload->>'amount')::bigint as target,(payload->>'progress')::bigint as saved,payload->>'currency' as currency,(payload->>'date')::date as target_date,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='goal';
create view public.debts with (security_invoker=true) as select id,owner_id,version,payload->>'title' as title,(payload->>'amount')::bigint as amount,(payload->>'progress')::bigint as repaid,payload->>'currency' as currency,(payload->>'date')::date as due_date,(payload->>'deleted')::boolean as deleted from public.records where payload->>'kind'='debt';
grant select on public.transactions,public.wallets,public.categories,public.budgets,public.bills,public.recurring_rules,public.goals,public.debts to authenticated;

-- Source migration: 004_report_access.sql
alter table public.ai_reports add column household_id uuid references public.households on delete cascade;
drop policy ai_own on public.ai_reports;
create policy ai_own on public.ai_reports for select to authenticated using(owner_id=auth.uid() and (household_id is null or public.is_member(household_id)));
create index rate_buckets_expiry on public.rate_buckets(reset_at);
create or replace function public.consume_quota(p_bucket text,p_limit int,p_seconds int) returns boolean language plpgsql security definer set search_path='' as $$declare n int;begin
 delete from public.rate_buckets where reset_at<now()-interval '7 days';
 insert into public.rate_buckets values(p_bucket,1,now()+make_interval(secs=>p_seconds)) on conflict(bucket) do update set count=case when public.rate_buckets.reset_at<=now() then 1 else public.rate_buckets.count+1 end,reset_at=case when public.rate_buckets.reset_at<=now() then now()+make_interval(secs=>p_seconds) else public.rate_buckets.reset_at end returning count into n;return n<=p_limit;
end$$;
revoke all on function public.consume_quota(text,int,int) from public,anon,authenticated;
grant execute on function public.consume_quota(text,int,int) to service_role;


-- Source migration: 005_restrict_membership_helpers.sql
-- Restrict membership helpers to signed-in callers and keep quota storage server-only.
revoke execute on function public.is_member(uuid), public.is_admin(uuid) from public, anon;
grant execute on function public.is_member(uuid), public.is_admin(uuid) to authenticated, service_role;
revoke all on public.rate_buckets from anon, authenticated;


-- Profile identity migration
-- Nullable only for existing accounts that have not supplied a name yet.
alter table public.profiles add column real_name text;
alter table public.profiles add constraint profiles_real_name_valid check (
 real_name is null or (char_length(btrim(real_name)) between 2 and 100 and real_name !~ '[[:cntrl:]]')
);
-- Preserve legitimate name metadata from signups during the deployment transition.
update public.profiles p set real_name=btrim(u.raw_user_meta_data->>'real_name')
from auth.users u where u.id=p.id and p.real_name is null
 and char_length(btrim(u.raw_user_meta_data->>'real_name')) between 2 and 100
 and (u.raw_user_meta_data->>'real_name') !~ '[[:cntrl:]]';
create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare supplied_name text; supplied_username text;
begin
 supplied_name:=btrim(new.raw_user_meta_data->>'real_name');
 supplied_username:=btrim(new.raw_user_meta_data->>'username');
 if supplied_name is null or char_length(supplied_name) not between 2 and 100 or supplied_name ~ '[[:cntrl:]]' then
  raise exception 'A real name of 2 to 100 characters is required' using errcode='23514';
 end if;
 insert into public.profiles(id,username,real_name) values(new.id,supplied_username,supplied_name);
 return new;
end $$;
-- Keep the existing lower(username) unique index and owner-only RLS policies.
revoke execute on function public.new_profile() from public,anon,authenticated;

COMMIT;
