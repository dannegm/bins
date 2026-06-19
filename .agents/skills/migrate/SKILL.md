---
name: migrate
description: >
  Create a new incremental migration file in migrations/ AND update db.sql
  (the canonical schema — the single source of truth for recreating the DB from scratch).
  Also keeps PLAN.md + context.md in sync.
  Invoke as: /migrate <description of what changes>
---

You are creating a database migration for the Bins project (Supabase / PostgreSQL, schema `bins`).

## Step 0 — Understand the change

The user's argument (`$ARGUMENTS`) describes what needs to change in the database. If the description is ambiguous or you need to know which table is affected, ask before proceeding.

## Step 1 — Determine the next migration number

List the files in `migrations/`. Each file is named `NNN_<slug>.sql` where NNN is a zero-padded 3-digit number. Find the highest existing number and add 1.

If `migrations/` is empty or doesn't exist, start at `001`.

## Step 2 — Derive the filename slug

Convert the user's description to a lowercase kebab-case slug, max 5 words. Examples:
- "add is_admin to profiles" → `add_is_admin_to_profiles`
- "add expires_at to bin_files" → `add_expires_at_to_bin_files`
- "create sessions table" → `create_sessions_table`

Full filename: `migrations/{NNN}_{slug}.sql`

## Step 3 — Write the migration file

Create `migrations/{NNN}_{slug}.sql`.

### SQL rules

- Always use idempotent syntax:
  - `ADD COLUMN IF NOT EXISTS` for new columns
  - `CREATE INDEX IF NOT EXISTS` for new indexes
  - `CREATE TABLE IF NOT EXISTS` for new tables
  - `CREATE OR REPLACE FUNCTION` for functions
  - `DROP COLUMN IF EXISTS` for removals
- Include a comment at the top: `-- Migration {NNN} — {description in sentence case}`
- Add `-- Run in Supabase SQL Editor` on the second line
- One blank line, then the SQL
- Group related statements (ALTER + INDEX for the same column go together)
- No transactions or `BEGIN/COMMIT` — Supabase SQL Editor runs DDL auto-committed
- If adding a NOT NULL column to an existing table, always include `DEFAULT <value>` so it doesn't fail on existing rows

### Typical patterns

**Add column:**
```sql
alter table bins.{table}
  add column if not exists {col} {type} {constraints};
```

**Add index:**
```sql
create index if not exists idx_{table}_{col} on bins.{table} ({col});
```

**New table:**
```sql
create table if not exists bins.{table} (
  ...
);
alter table bins.{table} enable row level security;
create policy "{table}: permitir todo"
  on bins.{table} for all using (true) with check (true);
```

**Grant for new table** (append after the table definition):
```sql
-- Grants are covered by ALTER DEFAULT PRIVILEGES in db.sql — no per-table grant needed
-- unless the table was created before the default privileges were set.
```

## Step 4 — Update db.sql (canonical schema)

`db.sql` is the **canonical schema** — a complete, self-contained SQL file that recreates the entire database from scratch on a fresh Supabase project. It is NOT a history of migrations; it always reflects the current desired state.

Apply the same logical change to `db.sql` so running it end-to-end produces the same result as running all migrations in order:

- **New column**: add it inside the `CREATE TABLE` block for the right table, with an inline comment matching the one in the migration
- **New table**: add the full `CREATE TABLE` block in the `-- Tablas` section; add `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and its policy in the `-- Row Level Security` section; add any index in `-- Índices`
- **New index**: add a `CREATE INDEX IF NOT EXISTS` line in the `-- Índices` section
- **Removed column**: delete it from the `CREATE TABLE` block
- **Renamed column**: update the name in place inside the `CREATE TABLE` block

Keep existing formatting and comment style. Do not reformat unrelated lines.

## Step 5 — Update PLAN.md

`PLAN.md` contains a canonical schema of the database in the `## Base de datos (Supabase)` section. Apply the same change there as in `db.sql` — same rules, same scope. It is a canonical schema, not a changelog.

## Step 6 — Confirm

Report to the user:
- Migration file created: `migrations/{NNN}_{slug}.sql`
- What changed in `db.sql` and `PLAN.md`
- The exact SQL to run, so the user can paste it into Supabase SQL Editor without opening the file
