-- =============================================================================
-- BINS — Database Schema
-- Supabase / PostgreSQL
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Schema
-- -----------------------------------------------------------------------------

create schema if not exists bins;


-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------

-- Perfiles de usuarios anónimos
create table bins.profiles (
  uuid         uuid primary key,
  name         text not null,
  color_light  text not null default '#e67e22',
  color_dark   text not null default '#f39c12',
  ip_hash      text,                              -- SHA-256 del IP público (registrado en primer visit)
  country      text,                              -- ej: "MX", "US"
  city         text,                              -- ej: "Mexico City"
  user_agent   text,                              -- UA completo (browser, OS, device se infieren en runtime)
  is_bot       boolean not null default false,    -- true si webdriver o patrón de bot detectado en UA
  is_admin     boolean not null default false,    -- true si el usuario tiene permisos de admin (solo editable desde DB)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz default now()
);

-- Bins
create table bins.bins (
  id            text primary key,         -- nanoid corto, ej: "xK3mPq"
  title         text default 'Untitled',
  author_id     uuid not null references bins.profiles(uuid) on delete cascade,
  visibility    text default 'public',    -- 'public' | 'unlisted' | 'private'
  is_readonly   boolean default true,
  views         int default 0,
  expires_at    timestamptz,              -- null = nunca expira
  packages      jsonb default '[]'::jsonb,
  forked_from   text references bins.bins(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Archivos de cada bin
create table bins.bin_files (
  id          text primary key,
  bin_id      text references bins.bins(id) on delete cascade,
  name        text not null,
  language    text default 'markdown',
  content     text,
  ydoc_state  bytea,
  position    int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Colaboradores / seguidores
create table bins.bin_collaborators (
  bin_id    text references bins.bins(id) on delete cascade,
  user_id   uuid not null,
  joined_at timestamptz default now(),
  primary key (bin_id, user_id)
);


-- -----------------------------------------------------------------------------
-- Constraints de límite
-- -----------------------------------------------------------------------------

-- 500KB máximo por archivo
alter table bins.bin_files
add constraint bin_file_max_size
check (octet_length(content) <= 512000);

-- 10 archivos máximo por bin
create or replace function bins.check_bin_files_limit()
returns trigger as $$
begin
  if (select count(*) from bins.bin_files where bin_id = NEW.bin_id) >= 10 then
    raise exception 'Límite de 10 archivos por bin alcanzado';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_bin_files_limit
before insert on bins.bin_files
for each row execute function bins.check_bin_files_limit();


-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------

alter table bins.profiles          enable row level security;
alter table bins.bins              enable row level security;
alter table bins.bin_files         enable row level security;
alter table bins.bin_collaborators enable row level security;

-- Helper: check if the requesting client is an admin (security definer avoids recursive RLS)
create or replace function bins.requesting_user_is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from bins.profiles where uuid = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- RPC: check bin existence and access without RLS blocking private bins
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

-- profiles
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

-- bins
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

-- bin_files
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

-- bin_collaborators
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


-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------

create index if not exists idx_profiles_is_bot   on bins.profiles (is_bot);
create index if not exists idx_profiles_is_admin on bins.profiles (is_admin);


-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA bins TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bins TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA bins TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bins TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON ROUTINES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON SEQUENCES TO authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Cron jobs de limpieza (requiere pg_cron)
-- -----------------------------------------------------------------------------

-- Cada 5 minutos: borrar bins expirados
select cron.schedule(
  'cleanup-expired-bins',
  '*/5 * * * *',
  $$
    delete from bins.bins
    where expires_at is not null
    and expires_at < now();
  $$
);

-- Cada lunes a las 3am: borrar perfiles de bots (cascada a bins y archivos)
select cron.schedule(
  'delete-bot-profiles',
  '0 3 * * 1',
  $$delete from bins.profiles where is_bot = true$$
)
where not exists (
  select 1 from cron.job where jobname = 'delete-bot-profiles'
);

-- Cada lunes a las 4am: borrar usuarios anónimos sin actividad en >30 días
create or replace function bins.cleanup_inactive_anon_users()
returns void
language plpgsql
security definer
as $$
begin
  delete from bins.profiles
  where uuid in (
    select id from auth.users
    where is_anonymous = true
    and coalesce(last_sign_in_at, created_at) < now() - interval '30 days'
  );

  delete from auth.users
  where is_anonymous = true
  and coalesce(last_sign_in_at, created_at) < now() - interval '30 days';
end;
$$;

select cron.schedule(
  'cleanup-inactive-anon-users',
  '0 4 * * 1',
  $$select bins.cleanup_inactive_anon_users()$$
)
where not exists (
  select 1 from cron.job where jobname = 'cleanup-inactive-anon-users'
);
