-- Migration 004 — Add cron job to delete bot profiles every Monday at 3am
-- Run in Supabase SQL Editor

select cron.schedule(
  'delete-bot-profiles',
  '0 3 * * 1',
  $$delete from bins.profiles where is_bot = true$$
)
where not exists (
  select 1 from cron.job where jobname = 'delete-bot-profiles'
);
