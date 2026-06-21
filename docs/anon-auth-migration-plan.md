# Anonymous Sign-Ins — Plan de Acción

> Hard cut total. Todos los usuarios existentes pierden su sesión al próximo acceso y obtienen una nueva identidad anónima vía Supabase Auth. No hay migración de datos.
>
> **No implementar hasta confirmación explícita.**

---

## Pasos manuales (tú los haces en el dashboard / CLI)

### 1. Habilitar Anonymous Sign-Ins en Supabase
Authentication → Sign In Methods → Anonymous → Enable

### 2. Borrar todos los datos existentes
Antes de desplegar, limpiar la base de datos para no dejar perfiles y bins huérfanos sin dueño:

```sql
truncate bins.bin_collaborators cascade;
truncate bins.bin_files cascade;
truncate bins.bins cascade;
truncate bins.profiles cascade;
```

### 3. Verificar variable de entorno
`VITE_SESSION_SECRET` debe estar definida en Vercel (ya debería estarlo). Es necesaria para que el export/import de sesión siga funcionando.

---

## Migración de base de datos

### Archivo: `migrations/007_anon_auth_rls.sql`

Reescribir todas las RLS policies para usar `auth.uid()` en lugar del header `x-client-id`. Cambios:

**Helper function:**
```sql
create or replace function bins.requesting_user_is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from bins.profiles where uuid = auth.uid()),
    false
  );
$$ language sql security definer stable;
```

**RPC `get_bin_access`:**
```sql
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
```

**GRANTs:** cambiar `TO anon` por `TO authenticated` en todas las tablas.

**Policies:** reemplazar en todas las ocurrencias:
```sql
-- antes
current_setting('request.headers', true)::json->>'x-client-id'

-- después
auth.uid()::text
```

Afecta: `bins.profiles` (5), `bins.bins` (5), `bins.bin_files` (5), `bins.bin_collaborators` (4) → 19 policies en total.

También actualizar `db.sql` (fuente canónica del schema).

### Archivo: `migrations/008_anon_user_cleanup_cron.sql`

Añadir cron semanal para eliminar usuarios anónimos abandonados (más de 30 días sin actividad). Requiere acceso a `auth.users` desde `pg_cron` vía función con `security definer` y service role, o migrar el cron de limpieza a una Edge Function de Supabase.

> **Nota:** Esta migración puede hacerse después del launch. No es bloqueante.

---

## Cambios en el frontend

### `src/services/supabase.js`
- Eliminar la inyección del header `x-client-id`
- El cliente se simplifica a un `createClient()` estándar

### `src/providers/identity-provider.jsx`
- Añadir flag de migración al inicio de `initIdentity()`:
  ```js
  const MIGRATION_DATE = '<fecha de deploy>';
  const migratedAt = settings.get('migratedAt');
  if (!migratedAt || migratedAt < MIGRATION_DATE) {
      settings.clear();
      settings.set('migratedAt', MIGRATION_DATE);
  }
  ```
- Reemplazar generación de UUID con sesión de Supabase Auth:
  ```js
  const { data: { session } } = await supabase().auth.getSession();
  const { data } = session
      ? { data: { session } }
      : await supabase().auth.signInAnonymously();
  const uuid = data.session.user.id;
  ```
- El resto de `initIdentity()` (nombre, colores, `syncProfile()`) queda igual

### `src/helpers/identity.js`
- Eliminar `generateUUID()` — ya no se usa
- `generateName()` y `generateColors()` se conservan

### `src/constants/default-settings.js`
- Mantener `user.uuid` como caché sincrónico del UUID de Auth (evita hacer async en contextos síncronos)

### `src/hooks/use-identity.js`
- Sin cambios de lógica — sigue leyendo de settings y upsertando el perfil

### `src/components/settings/import-export-section.jsx` + `src/pages/login.jsx`
- Actualizar el export de sesión para incluir el `refresh_token` de Supabase Auth:
  ```js
  const { data: { session } } = await supabase().auth.getSession();
  const token = await signJWT({ user, refreshToken: session.refresh_token }, { expiresIn: '15m' });
  ```
- Actualizar el import en `/login` para restaurar la sesión Auth:
  ```js
  const { user, refreshToken } = await verifyJWT(token);
  await supabase().auth.setSession({ access_token: '...', refresh_token: refreshToken });
  settings.set('user', user);
  ```

---

## Orden de ejecución

1. Pasos manuales en Supabase dashboard (habilitar Anonymous Sign-Ins, truncar datos)
2. Escribir y aplicar `migrations/007_anon_auth_rls.sql` + actualizar `db.sql`
3. Cambios en frontend (supabase.js → identity-provider → import-export)
4. Probar flujo completo: nueva sesión, crear bin, export/import de sesión
5. Deploy a Vercel
6. `migrations/008_anon_user_cleanup_cron.sql` — puede ir en un PR separado posterior

---

## Qué NO cambia

- UX de registro — sigue siendo 100% invisible para el usuario
- Sistema de nombres y colores
- Yjs / Realtime / sync colaborativo
- Admin claim (endpoint externo + columna `is_admin`)
- Feature de export/import de sesión — se adapta, no se elimina
