-- Migration 008 — Weekly cron: delete inactive anonymous users (>30 days)
-- NOT BLOCKING for launch — apply in a subsequent PR after validating 007
-- Requires pg_cron. The security definer function runs as postgres so it can
-- access auth.users without going through RLS.

create or replace function bins.cleanup_inactive_anon_users()
returns void
language plpgsql
security definer
as $$
begin
  delete from bins.profiles
  where uuid in (
    select id from auth.users
    where is_anonymous = true
    and coalesce(last_sign_in_at, created_at) < now() - interval '30 days'
  );

  delete from auth.users
  where is_anonymous = true
  and coalesce(last_sign_in_at, created_at) < now() - interval '30 days';
end;
$$;

select cron.schedule(
  'cleanup-inactive-anon-users',
  '0 4 * * 1',
  $$select bins.cleanup_inactive_anon_users()$$
)
where not exists (
  select 1 from cron.job where jobname = 'cleanup-inactive-anon-users'
);
