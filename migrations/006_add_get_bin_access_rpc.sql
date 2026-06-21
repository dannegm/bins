-- Migration 006 — Add get_bin_access RPC function for private bin visibility check
-- Run in Supabase SQL Editor

create or replace function bins.get_bin_access(p_bin_id text)
returns table(bin_exists bool, can_access bool)
security definer
stable
language sql
as $$
  with b as (
    select visibility, author_id
    from bins.bins
    where id = p_bin_id
  )
  select
    (exists (select 1 from b))::bool,
    (exists (
      select 1 from b
      where visibility != 'private'
         or author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
         or bins.requesting_user_is_admin()
    ))::bool;
$$;
