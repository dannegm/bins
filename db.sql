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

alter table bins.bins              enable row level security;
alter table bins.bin_files         enable row level security;
alter table bins.bin_collaborators enable row level security;

-- Políticas permisivas — toda la lógica de visibilidad y autorización se maneja en el cliente.
-- Pendiente: refinar con policies granulares en una iteración futura.
create policy "bins: permitir todo"
  on bins.bins for all using (true) with check (true);

create policy "bin_files: permitir todo"
  on bins.bin_files for all using (true) with check (true);

create policy "bin_collaborators: permitir todo"
  on bins.bin_collaborators for all using (true) with check (true);


-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------

create index if not exists idx_profiles_is_bot   on bins.profiles (is_bot);
create index if not exists idx_profiles_is_admin on bins.profiles (is_admin);


-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bins TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


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
);
