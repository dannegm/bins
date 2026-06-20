-- Migration 005 — Allow author to bypass is_readonly check on bins and bin_files
-- Run in Supabase SQL Editor

-- bins: author can update even when is_readonly = true
drop policy if exists "bins: update when not readonly" on bins.bins;

create policy "bins: update when not readonly"
  on bins.bins for update
  using (
    is_readonly = false
    or author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
  )
  with check (
    is_readonly = false
    or author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
  );

-- bin_files: author can insert/update files even when parent bin is_readonly = true
drop policy if exists "bin_files: insert inherits bin readonly" on bins.bin_files;

create policy "bin_files: insert inherits bin readonly"
  on bins.bin_files for insert
  with check (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and (
        b.is_readonly = false
        or b.author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
      )
    )
  );

drop policy if exists "bin_files: update inherits bin readonly" on bins.bin_files;

create policy "bin_files: update inherits bin readonly"
  on bins.bin_files for update
  using (
    exists (
      select 1 from bins.bins b
      where b.id = bin_id
      and (
        b.is_readonly = false
        or b.author_id::text = current_setting('request.headers', true)::json->>'x-client-id'
      )
    )
  );
