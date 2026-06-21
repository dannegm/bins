-- Migration 007 — Rewrite RLS policies to use auth.uid() (Supabase anonymous sign-ins)
-- Run AFTER: enabling Anonymous Sign-Ins in Supabase dashboard + truncating existing data
-- Replaces x-client-id header identity with auth.uid() across all 19 policies

-- -------------------------------------------------------------------------
-- Drop existing policies
-- -------------------------------------------------------------------------

drop policy if exists "profiles: admin full access"       on bins.profiles;
drop policy if exists "profiles: anyone can select"       on bins.profiles;
drop policy if exists "profiles: anyone can insert"       on bins.profiles;
drop policy if exists "profiles: owner can update"        on bins.profiles;
drop policy if exists "profiles: owner can delete"        on bins.profiles;

drop policy if exists "bins: admin full access"           on bins.bins;
drop policy if exists "bins: select by visibility"        on bins.bins;
drop policy if exists "bins: anyone can insert"           on bins.bins;
drop policy if exists "bins: update when not readonly"    on bins.bins;
drop policy if exists "bins: owner can delete"            on bins.bins;

drop policy if exists "bin_files: admin full access"               on bins.bin_files;
drop policy if exists "bin_files: select inherits bin visibility"  on bins.bin_files;
drop policy if exists "bin_files: insert inherits bin readonly"    on bins.bin_files;
drop policy if exists "bin_files: update inherits bin readonly"    on bins.bin_files;
drop policy if exists "bin_files: delete inherits bin owner"       on bins.bin_files;

drop policy if exists "bin_collaborators: admin full access"        on bins.bin_collaborators;
drop policy if exists "bin_collaborators: anyone can select"        on bins.bin_collaborators;
drop policy if exists "bin_collaborators: anyone can insert"        on bins.bin_collaborators;
drop policy if exists "bin_collaborators: owner or self can delete" on bins.bin_collaborators;

-- -------------------------------------------------------------------------
-- Update helper function
-- -------------------------------------------------------------------------

create or replace function bins.requesting_user_is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from bins.profiles where uuid = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- -------------------------------------------------------------------------
-- Update get_bin_access RPC
-- -------------------------------------------------------------------------

create or replace function bins.get_bin_access(p_bin_id text)
returns table(bin_exists bool, can_access bool)
security definer stable language sql as $$
  with b as (select visibility, author_id from bins.bins where id = p_bin_id)
  select
    (exists (select 1 from b))::bool,
    (exists (
      select 1 from b
      where visibility != 'private'
         or author_id = auth.uid()
         or bins.requesting_user_is_admin()
    ))::bool;
$$;

-- -------------------------------------------------------------------------
-- Revoke anon grants — all users now go through Supabase Auth (authenticated role)
-- -------------------------------------------------------------------------

revoke all on all tables    in schema bins from anon;
revoke all on all routines  in schema bins from anon;
revoke all on all sequences in schema bins from anon;
revoke usage on schema bins from anon;

-- -------------------------------------------------------------------------
-- Recreate policies — profiles
-- -------------------------------------------------------------------------

create policy "profiles: admin full access"
  on bins.profiles for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "profiles: anyone can select"
  on bins.profiles for select using (true);

create policy "profiles: owner can insert"
  on bins.profiles for insert
  with check (uuid = auth.uid());

create policy "profiles: owner can update"
  on bins.profiles for update
  using (uuid = auth.uid())
  with check (uuid = auth.uid() and is_admin = false);

create policy "profiles: owner can delete"
  on bins.profiles for delete
  using (uuid = auth.uid());

-- -------------------------------------------------------------------------
-- Recreate policies — bins
-- -------------------------------------------------------------------------

create policy "bins: admin full access"
  on bins.bins for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "bins: select by visibility"
  on bins.bins for select
  using (
    visibility in ('public', 'unlisted')
    or author_id = auth.uid()
  );

create policy "bins: owner can insert"
  on bins.bins for insert
  with check (author_id = auth.uid());

create policy "bins: update when not readonly"
  on bins.bins for update
  using (
    is_readonly = false
    or author_id = auth.uid()
  )
  with check (
    is_readonly = false
    or author_id = auth.uid()
  );

create policy "bins: owner can delete"
  on bins.bins for delete
  using (author_id = auth.uid());

-- -------------------------------------------------------------------------
-- Recreate policies — bin_files
-- -------------------------------------------------------------------------

create policy "bin_files: admin full access"
  on bins.bin_files for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "bin_files: select inherits bin visibility"
  on bins.bin_files for select
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and (
        b.visibility in ('public', 'unlisted')
        or b.author_id = auth.uid()
      )
    )
  );

create policy "bin_files: insert inherits bin readonly"
  on bins.bin_files for insert
  with check (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and (
        b.is_readonly = false
        or b.author_id = auth.uid()
      )
    )
  );

create policy "bin_files: update inherits bin readonly"
  on bins.bin_files for update
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and (
        b.is_readonly = false
        or b.author_id = auth.uid()
      )
    )
  );

create policy "bin_files: delete inherits bin owner"
  on bins.bin_files for delete
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.author_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- Recreate policies — bin_collaborators
-- -------------------------------------------------------------------------

create policy "bin_collaborators: admin full access"
  on bins.bin_collaborators for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "bin_collaborators: anyone can select"
  on bins.bin_collaborators for select using (true);

create policy "bin_collaborators: anyone can insert"
  on bins.bin_collaborators for insert with check (true);

create policy "bin_collaborators: owner or self can delete"
  on bins.bin_collaborators for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.author_id = auth.uid()
    )
  );
