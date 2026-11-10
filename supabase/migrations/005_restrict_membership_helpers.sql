-- Restrict membership helpers to signed-in callers and keep quota storage server-only.
revoke execute on function public.is_member(uuid), public.is_admin(uuid) from public, anon;
grant execute on function public.is_member(uuid), public.is_admin(uuid) to authenticated, service_role;
revoke all on public.rate_buckets from anon, authenticated;
