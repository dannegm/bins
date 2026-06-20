-- Migration 003 — Add index on profiles.is_bot
-- Run in Supabase SQL Editor

create index if not exists idx_profiles_is_bot on bins.profiles (is_bot);
