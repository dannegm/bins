-- Migration 012 — Grant anon read access to profiles (needed by Edge Middleware for OG tags)
-- Migration 011 restored anon access to bins + bin_files but omitted profiles,
-- causing the middleware to fall back to "Anonymous" for all author names.

grant select on bins.profiles to anon;
