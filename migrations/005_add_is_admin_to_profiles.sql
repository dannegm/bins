-- Migration 005 — Add is_admin to profiles
-- Run in Supabase SQL Editor

alter table bins.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists idx_profiles_is_admin on bins.profiles (is_admin);
