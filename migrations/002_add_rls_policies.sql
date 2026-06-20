-- Migration 002 — Add granular RLS policies using is_admin and client identity
-- Run in Supabase SQL Editor

-- Helper: check if the requesting client is an admin (security definer avoids recursive RLS)
create or replace function bins.requesting_user_is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from bins.profiles
     where uuid::text = current_setting('request.headers', true)::json->>'x-client-id'),
    false
  );
$$ language sql security definer stable;


-- -----------------------------------------------------------------------------
-- profiles — enable RLS + granular policies
-- -----------------------------------------------------------------------------

alter table bins.profiles enable row level security;

create policy "profiles: admin full access"
  on bins.profiles for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "profiles: anyone can select"
  on bins.profiles for select using (true);

create policy "profiles: anyone can insert"
  on bins.profiles for insert with check (true);

-- Owner can update own profile but cannot self-escalate is_admin
create policy "profiles: owner can update"
  on bins.profiles for update
  using (uuid::text = current_setting('request.headers', true)::json->>'x-client-id')
  with check (
    uuid::text = current_setting('request.headers', true)::json->>'x-client-id'
    and is_admin = false
  );

create policy "profiles: owner can delete"
  on bins.profiles for delete
  using (uuid::text = current_setting('request.headers', true)::json->>'x-client-id');


-- -----------------------------------------------------------------------------
-- bins — replace blanket policy with granular ones
-- -----------------------------------------------------------------------------

drop policy if exists "bins: permitir todo" on bins.bins;

create policy "bins: admin full access"
  on bins.bins for all
  using (bins.requesting_user_is_admin())
  with check (bins.requesting_user_is_admin());

create policy "bins: select by visibility"
  on bins.bins for select
  using (
    visibility in ('public', 'unlisted')
    or author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
  );

create policy "bins: anyone can insert"
  on bins.bins for insert with check (true);

create policy "bins: update when not readonly"
  on bins.bins for update
  using (is_readonly = false)
  with check (is_readonly = false);

create policy "bins: owner can delete"
  on bins.bins for delete
  using (author_id::text = current_setting('request.headers', true)::json->>'x-client-id');


-- -----------------------------------------------------------------------------
-- bin_files — replace blanket policy, inherit from parent bin
-- -----------------------------------------------------------------------------

drop policy if exists "bin_files: permitir todo" on bins.bin_files;

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
        or b.author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
      )
    )
  );

create policy "bin_files: insert inherits bin readonly"
  on bins.bin_files for insert
  with check (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.is_readonly = false
    )
  );

create policy "bin_files: update inherits bin readonly"
  on bins.bin_files for update
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.is_readonly = false
    )
  );

create policy "bin_files: delete inherits bin owner"
  on bins.bin_files for delete
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
    )
  );


-- -----------------------------------------------------------------------------
-- bin_collaborators — replace blanket policy
-- -----------------------------------------------------------------------------

drop policy if exists "bin_collaborators: permitir todo" on bins.bin_collaborators;

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
    user_id::text = current_setting('request.headers', true)::json->>'x-client-id'
    or exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and b.author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
    )
  );
