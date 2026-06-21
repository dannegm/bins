-- Migration 009 — Delete auth.users entry when a profile is deleted
-- Keeps Supabase Auth in sync with bins.profiles without needing a service role
-- from the frontend. The security definer function runs as postgres, which has
-- access to auth.users.

create or replace function bins.delete_auth_user_on_profile_delete()
returns trigger
language plpgsql
security definer
as $$
begin
    delete from auth.users where id = OLD.uuid;
    return OLD;
end;
$$;

create trigger on_profile_deleted
    after delete on bins.profiles
    for each row
    execute function bins.delete_auth_user_on_profile_delete();
