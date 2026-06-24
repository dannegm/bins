-- Migration 011 — Grant anon read access to public/unlisted bins for embed support
-- Run in Supabase SQL Editor

grant usage on schema bins to anon;

grant select on bins.bins      to anon;
grant select on bins.bin_files to anon;

grant execute on function bins.get_bin_access(text) to anon;
