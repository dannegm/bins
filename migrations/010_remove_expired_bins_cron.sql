-- Migration 010 — Remove expired bins cleanup cron job
-- The expires_at feature is not in use; dropping the cron to avoid unintended deletions.

select cron.unschedule('cleanup-expired-bins');
