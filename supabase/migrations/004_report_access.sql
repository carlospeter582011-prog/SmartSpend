begin;
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
commit;
