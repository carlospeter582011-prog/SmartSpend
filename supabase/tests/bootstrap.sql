-- Disposable PostgreSQL-only Supabase auth compatibility fixture.
-- Never run in a real Supabase project: that project already owns auth schema/roles.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to anon,authenticated,service_role;
grant execute on function auth.uid() to public;
alter default privileges in schema public grant select,insert,update,delete on tables to anon,authenticated,service_role;
alter default privileges in schema public grant usage,select on sequences to anon,authenticated,service_role;
