begin;
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
commit;
