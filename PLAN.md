# Bins — Plan de Proyecto

**Nombre:** Bins
**Dominio:** `bins.hckr.mx`
**Deploy:** Vercel
**Plataformas:** Desktop y mobile — prioridad desktop

---

## Índice

1. [Instrucciones antes de comenzar](#-instrucciones-antes-de-comenzar)
2. [Mantenimiento de documentación](#mantenimiento-de-documentación-durante-el-desarrollo)
3. [Reglas de código y convenciones](#reglas-de-código-y-convenciones)
4. [Stack tecnológico](#stack-tecnológico)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Base de datos](#base-de-datos-supabase)
7. [Identidad anónima y Settings](#modelo-de-identidad-anónima)
8. [Sistema de temas](#sistema-de-temas)
9. [Tipografía](#tipografía)
10. [Rutas](#rutas)
11. [Layout](#layout--desktop)
12. [Página de Settings](#página-de-settings-settings)
13. [Permisos](#permisos)
14. [Features del home](#features-del-home)
15. [Editor — Monaco](#sincronización-en-tiempo-real)
16. [Sincronización en tiempo real](#sincronización-en-tiempo-real)
17. [Lenguajes soportados](#lenguajes-soportados)
18. [Sistema de runners](#sistema-de-runners)
19. [Runner HTTP](#runner-http-http--rest)
20. [Paquetes npm](#paquetes-npm-jstsjsxtsx)
21. [Fork](#fork)
22. [Guardado y ciclo de vida del bin](#guardado-y-ciclo-de-vida-del-bin)
23. [Favicon y document.title](#favicon-y-documenttitle)
24. [Sistema de comandos (`useCommands`)](#sistema-de-comandos-usecommands)
25. [Command Palette](#command-palette-cmdk)
26. [Keybindings](#keybindings)
27. [Paneles responsivos](#paneles-responsivos)
28. [TanStack Query](#tanstack-query)
29. [Sistema de eventos interno (BusProvider)](#sistema-de-eventos-interno-busprovider)
30. [Sistema de comandos (ntfy)](#sistema-de-comandos-ntfy)
31. [Exportar / Importar sesión](#exportar--importar-sesión)
32. [AI Completions](#ai-completions)
33. [Internacionalización (i18n)](#internacionalización-i18n)
34. [Estados especiales de UI](#estados-especiales-de-ui)
35. [Variables de entorno](#variables-de-entorno)
36. [Tareas previas al desarrollo](#tareas-previas-al-desarrollo)
37. [Fases de desarrollo](#fases-de-desarrollo)

---

## ⚠️ Instrucciones antes de comenzar

**No inicies el proyecto todavía.**

Antes de ejecutar cualquier comando o crear cualquier archivo, el autor proporcionará:

- Contexto adicional del proyecto
- Herramientas, snippets o librerías de referencia
- Aclaraciones finales

Solo inicia el setup cuando el autor lo indique explícitamente con una instrucción clara.

### Desarrollo incremental

El desarrollo debe ser **paso a paso**, haciendo pausas entre cada unidad de trabajo para que el autor pueda probar manualmente antes de continuar.

- **No implementar múltiples features de una sola vez** — completar una cosa, pausar, esperar feedback
- **No hacer pruebas automatizadas** — el autor prueba todo manualmente
- **Cada pausa debe incluir** un resumen claro de qué se implementó, qué probar, y cuál es el siguiente paso propuesto
- **Esperar confirmación explícita** antes de continuar con el siguiente paso
- Si algo no funciona, el autor lo reporta y se corrige antes de avanzar

---

## Mantenimiento de documentación durante el desarrollo

Durante **todo** el desarrollo se deben mantener los siguientes archivos sincronizados y actualizados:

### `CLAUDE.md`

Archivo principal de contexto para Claude Code. Debe mantenerse actualizado con:

- Estado actual del proyecto
- Decisiones técnicas tomadas y su justificación
- Features completados, en progreso y pendientes
- Problemas conocidos y soluciones aplicadas
- Convenciones y reglas del proyecto

### `AGENTS.md`

Copia adaptada de `CLAUDE.md` para otras IAs (Cursor, Copilot, Gemini, etc.). Mismo contenido pero en formato más neutral, sin instrucciones específicas de Claude. Debe mantenerse sincronizado con `CLAUDE.md`.

### `/docs` — Documentación viva

```
/docs
  architecture.md       — Decisiones de arquitectura, diagramas, flujos
  database.md           — Schema de DB, relaciones, índices, políticas RLS
  sync.md               — Cómo funciona Yjs + Supabase Realtime
  runners.md            — Sistema de runners por lenguaje, cómo extender
  keybindings.md        — Shortcuts registrados, configurables
  components.md         — Componentes principales, props, responsabilidades
  settings.md           — Schema de settings, URL sharing, localStorage
  theming.md            — Sistema de temas: tokens, data-theme, cómo agregar temas
  deployment.md         — Variables de entorno, build, self-hosting
  changelog.md          — Registro cronológico de cambios importantes
```

Estos archivos no son opcionales — son parte del entregable del proyecto.

---

## Reglas de código y convenciones

- **Solo JavaScript** — sin TypeScript en ningún archivo
- **`export const`** para todas las funciones y variables exportadas
- **React** únicamente — sin HTML puro fuera de JSX
- Variables `useRef` con prefijo `$` y sin sufijo `Ref` (ej: `$editor`, `$container`)
- `async/await` sobre `.then()/.catch()`
- Nombres de funciones descriptivos y específicos al caso de uso
- Sin comentarios obvios — el código debe ser autoexplicativo
- Componentes en PascalCase, hooks en camelCase con prefijo `use`
- Archivos de componentes en `kebab-case.jsx`, utils en `kebab-case.js`
- **Todas las carpetas y archivos en kebab-case** sin excepción

---

## Stack tecnológico

| Capa                  | Herramienta                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| Framework             | Vite + React                                                                      |
| Estilos               | Tailwind CSS v4                                                                   |
| Componentes           | shadcn/ui con **Base UI** (`@base-ui-components/react`) como primitivo — no Radix |
| Toasts                | sonner                                                                            |
| Editor                | Monaco Editor (`vite-plugin-monaco-editor`)                                       |
| CRDT / Sync           | Yjs                                                                               |
| Transporte realtime   | Supabase Realtime (Broadcast)                                                     |
| Base de datos         | Supabase (PostgreSQL)                                                             |
| Server state          | TanStack Query                                                                    |
| Estado URL            | nuqs                                                                              |
| Routing               | TanStack Router (file-based, plugin de Vite)                                      |
| Hotkeys               | useHotkeys                                                                        |
| Command palette       | cmdk (shadcn)                                                                     |
| Gestos / drag         | `@use-gesture/react`                                                              |
| Paneles resizables    | `react-resizable-panels` (via shadcn Resizable)                                   |
| Regex parser          | regexp-tree                                                                       |
| Railroad diagrams     | regexper                                                                          |
| TS/JSX transpile      | sucrase (browser, para REPL)                                                      |
| Formatter             | Prettier                                                                          |
| Validación de schemas | Zod                                                                               |
| IDs cortos            | nanoid                                                                            |
| Nombres anónimos      | `adjective-animal` autogenerado                                                   |
| ZIP download          | JSZip                                                                             |
| Avatares              | DiceBear (`@dicebear/core` + `@dicebear/collection`, estilo `rings`, seed = UUID) |
| Iconos de lenguajes   | Devicon (SVG/font, con color)                                                     |
| Internacionalización  | `react-i18next`                                                                   |
| JWT (sesión)          | `jose`                                                                            |
| Pub/sub comandos      | ntfy (capa de abstracción proporcionada por el autor)                             |
| AI Completions        | Claude / OpenAI / Gemini / OpenRouter / Ollama (configurable)                     |

### Nota sobre shadcn + Base UI

shadcn/ui es un wrapper que puede usar distintos primitivos. En este proyecto se usa **Base UI** en lugar de Radix para todos los componentes. Si algún componente aún no tiene soporte en Base UI, usar Radix como fallback temporal y documentarlo en `CLAUDE.md`.

---

## Estructura del proyecto

```
src/
  routes/
    __root.jsx                      — Layout global, monta providers
    index.jsx                       — Home
    editor.$bin-id.jsx              — Editor colaborativo principal
    embed.$bin-id.jsx               — Vista embed (readonly, sin UI)
    settings.jsx                    — Página de configuración completa
    user.$uuid.jsx                  — Perfil público de usuario
    admin.bins.jsx                  — Admin: listado de todos los bins
    admin.users.jsx                 — Admin: listado de todos los usuarios
  components/
    editor/
      monaco-editor.jsx             — Monaco + Yjs binding
      tab-bar.jsx                   — Tabs, renombrar, reordenar, overflow. Icono trash al hover para eliminar (con confirmación). Dot cyan en tabs con cambios no vistos
      status-bar.jsx                — Lenguaje, línea/col, sync, usuarios activos
      awareness-bar.jsx             — Avatares de colaboradores activos
      runner-panel.jsx              — Panel derecho para previews y REPLs
    runners/
      markdown-runner.jsx
      html-runner.jsx               — iframe "browser" con resolver de imports
      js-repl-runner.jsx            — REPL con console output (JS/TS/JSX/TSX)
      regex-runner.jsx              — Playground con railroad diagrams
      http-runner.jsx               — Cliente HTTP tipo Postman, via proxy
    settings/
      identity-section.jsx
      appearance-section.jsx        — Tema UI y Monaco con miniaturas
      editor-section.jsx
      keybindings-section.jsx
      prettier-section.jsx          — Opciones globales y por lenguaje
      ai-completions-section.jsx
      import-export-section.jsx
    home/
      bin-list.jsx
      bin-card.jsx
    shared/
      command-palette.jsx
      search-widget.jsx             — Widget flotante drag+snap, posición en settings
      error-boundary.jsx            — BSOD estilizado
      share-button.jsx
      fork-button.jsx
      packages-modal.jsx            — Gestor de paquetes npm (JS/TS/JSX/TSX)
      tips-carousel.jsx             — Carrusel de tips para el home
      tips-widget.jsx               — Recuadro flotante de tips para el editor
      theme-thumbnail.jsx           — Miniatura visual de un tema
      user-avatar.jsx               — Avatar DiceBear rings desde UUID
      responsive-modal.jsx          — Dialog (desktop) o Drawer (mobile)
    layout/
      activity-bar.jsx              — Barra lateral desktop
      mobile-nav.jsx                — Nav inferior mobile
  ui/
    button.jsx
    input.jsx
    switch.jsx
    tooltip.jsx
    dropdown.jsx
    dialog.jsx
    tabs.jsx
    badge.jsx
    separator.jsx
    scroll-area.jsx
    code-editor-simple.jsx          — Monaco recortado reutilizable (sin tabs ni status bar)
    icons.js                        — SVGs custom (el autor proporcionará el componente base)
  providers/
    theme-provider.jsx              — Aplica data-theme al <html>
    settings-provider.jsx           — Settings globales desde localStorage
    identity-provider.jsx           — UUID, nombre, colores del usuario anónimo
    query-provider.jsx              — TanStack Query client y configuración
    bus-provider.jsx                — Bus de eventos interno (proporcionado por el autor)
    providers.jsx                   — Árbol global de providers + inyección de estilos
  helpers/
    utils.js                        — cn() de shadcn + utilidades generales
    arrays.js
    objects.js                      — Dot notation resolver (proporcionado por el autor)
    parsers.js                      — Parsers custom para nuqs, parseAsShorthandBoolean (proporcionado por el autor)
    strings.js
    numbers.js
    monaco.js                       — Helpers específicos de Monaco
    import-resolver.js              — Resolución de ./archivo en runners
    download.js                     — Descarga individual y ZIP
    nanoid.js                       — Generador de IDs cortos
    identity.js                     — Generación de UUID + nombre adjective-animal
  services/
    settings.js                     — CRUD de settings en localStorage
    supabase.js                     — Cliente Supabase + $schema
    bins.js                         — Queries de bins (create, get, list, delete)
    bin-files.js                    — Queries de archivos
    yjs.js                          — Inicialización Y.Doc + provider por archivo
    keybindings.js                  — Registro y resolución de shortcuts
    runners.js                      — Registro de runners por lenguaje
    monaco-themes.js                — Definición de temas Monaco (Dracula, etc.)
    languages.js                    — Mapa de lenguajes, extensiones, runners, iconos
    ai-completions.js               — Adapters por proveedor de IA
    commands.js                     — Sistema de comandos ntfy
    ntfy.js                         — Capa de abstracción ntfy (proporcionada por el autor)
  hooks/
    use-collaboration.js            — Yjs + awareness por archivo
    use-monaco.js                   — Setup de Monaco, temas, keybindings
    use-identity.js                 — UUID, nombre, colores del usuario
    use-settings.js                 — Settings con persistencia
    use-theme.js                    — Tema activo, cambiar tema
    use-virtual-keyboard.js         — Detección de teclado virtual (mobile)
    use-code-scramble.js            — Animación scramble para loading del editor
    use-commands.js                 — Listener global de comandos via useEvent()
    use-favicon.js                  — Favicon dinámico con canvas (dots de estado)
    use-document-title.js           — document.title con nombre del bin y prefijos de estado
  css/
    index.css                       — Entry point: imports de fuentes → tailwind → temas → utils → fonts
    fonts.css                       — Variables CSS de tipografía (--font-sans, --font-mono)
    utils.css                       — Extensiones y utilities de Tailwind
    themes/
      index.css                     — Importa todos los temas
      dark.css
      light.css
      dracula.css
  locales/
    en.json
    es.json
  constants/
    languages.js
    themes.js                       — { id, label, isDark, thumbnail } por tema UI y Monaco
    default-settings.js
  assets/
    fonts/
    images/
    sounds/                         — nudge MSN y otros
```

---

## Base de datos (Supabase)

### Tablas

```sql
-- Crear schema
create schema if not exists bins;

-- Perfiles de usuarios anónimos
create table bins.profiles (
  uuid        uuid primary key,
  name        text not null,
  updated_at  timestamptz default now()
);

-- Bins
create table bins.bins (
  id            text primary key,         -- nanoid corto, ej: "xK3mPq"
  title         text default 'Untitled',
  author_id     uuid not null references bins.profiles(uuid) on delete set null,
  visibility    text default 'public',    -- 'public' | 'unlisted'
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
```

### Constraints de límite

```sql
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
```

### Row Level Security (RLS)

RLS controla qué filas puede leer/escribir cada cliente. Como no hay auth, usamos el UUID del cliente enviado como header custom `x-client-id` en cada request de Supabase.

```sql
alter table bins.bins              enable row level security;
alter table bins.bin_files         enable row level security;
alter table bins.bin_collaborators enable row level security;

-- BINS
create policy "bins: lectura pública"
  on bins.bins for select using (visibility = 'public');

create policy "bins: lectura unlisted"
  on bins.bins for select using (visibility = 'unlisted');

create policy "bins: insertar propio"
  on bins.bins for insert
  with check (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);

create policy "bins: actualizar propio"
  on bins.bins for update
  using (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);

create policy "bins: eliminar propio"
  on bins.bins for delete
  using (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);

-- BIN_FILES
create policy "bin_files: lectura"
  on bins.bin_files for select
  using (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.visibility in ('public', 'unlisted')
        or bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );

create policy "bin_files: insertar"
  on bins.bin_files for insert
  with check (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );

create policy "bin_files: actualizar"
  on bins.bin_files for update
  using (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );

create policy "bin_files: eliminar"
  on bins.bin_files for delete
  using (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );

-- BIN_COLLABORATORS
create policy "bin_collaborators: lectura pública"
  on bins.bin_collaborators for select
  using (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_collaborators.bin_id
      and bins.bins.visibility in ('public', 'unlisted')
    )
  );

create policy "bin_collaborators: registrarse"
  on bins.bin_collaborators for insert
  with check (
    user_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
    and exists (
      select 1 from bins.bins
      where bins.bins.id = bin_collaborators.bin_id
      and bins.bins.visibility in ('public', 'unlisted')
    )
  );

create policy "bin_collaborators: dejar de seguir"
  on bins.bin_collaborators for delete
  using (user_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);
```

### Cron job de limpieza

```sql
select cron.schedule(
  'cleanup-expired-bins',
  '*/5 * * * *',
  $$
    delete from bins.bins
    where expires_at is not null
    and expires_at < now();
  $$
);
```

### Cliente Supabase (`services/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js';
import { getSettings } from './settings.js';

const { uuid } = getSettings();

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        global: {
            headers: { 'x-client-id': uuid },
        },
    },
);

// Usar $schema.from('bins') en lugar de supabase.from('bins.bins')
export const $schema = supabase.schema('bins');
```

### Notas

- `is_readonly` es `true` por default — solo el autor puede editar
- El admin (usuario con `VITE_ADMIN_KEY` en localStorage) puede editar y eliminar cualquier bin
- No hay tabla `users` ni registro — identidad anónima en localStorage
- `bins.profiles` se puebla via upsert silencioso al arrancar la app
- El `uuid` **nunca cambia**
- `ydoc_state` persiste el estado de Yjs para usuarios que entran tarde
- `content` es snapshot de texto plano para preview sin cargar Yjs

---

## Modelo de identidad anónima

**localStorage** (via `services/settings.js`):

```js
{
  uuid: "550e8400-e29b-41d4-a716-446655440000", // generado una sola vez, nunca cambia
  name: "lazy-panda",                            // editable, se sincroniza con DB
  colorLight: "#e67e22",
  colorDark: "#f39c12",
}
```

**DB** (`bins.profiles`):

```js
{ uuid: "...", name: "lazy-panda" }  // siempre actualizado via upsert
```

**Ciclo de vida:**

1. Al arrancar la app → upsert silencioso de `{ uuid, name }` en `bins.profiles`
2. Al cambiar el nombre en settings → upsert inmediato en `bins.profiles`
3. El `uuid` nunca cambia bajo ninguna circunstancia

### Schema de settings

```js
{
  // Identidad
  uuid: "...",
  name: "lazy-panda",
  colorLight: "#hex",
  colorDark: "#hex",

  // Apariencia
  language: 'en',
  uiTheme: "dark",
  monacoTheme: "dracula",

  // Editor Monaco
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  lineNumbers: true,
  minimap: false,

  // Search widget
  searchWidget: { x: 0, y: 0 },

  // Runner panel
  runnerPanel: { size: 40 },  // porcentaje del ancho

  // Tips
  tipsEnabled: true,

  // AI Completions
  aiCompletions: {
    enabled: false,
    provider: 'ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    model: '',
  },

  // Keybindings personalizados
  keybindings: {
    redo: "cmd+y",
  },

  // Prettier
  prettier: {
    printWidth: 80,
    singleQuote: true,
    semi: false,
    trailingComma: "es5",
    tabWidth: 2,
    bracketSpacing: true,
    endOfLine: "lf",
    overrides: {}
  }
}
```

### URL sharing (`/settings?config=...`)

- El JSON se serializa con `nuqs` en el query param `config`
- Al entrar a `/settings?config={...}` se muestra un banner de confirmación
- El usuario confirma → `services/settings.js` lo aplica y persiste

---

## Sistema de temas

### Filosofía

El UI completo se basa en CSS custom properties definidas por tema. El atributo `data-theme` en `<html>` activa el tema via `document.documentElement.setAttribute('data-theme', theme)` desde `ThemeProvider`. Tailwind v4 consume esas variables como tokens via `@theme`. Nunca hardcodear colores.

### Distinción importante

- **Tema de UI** (`data-theme`): controla colores de la interfaz
- **Tema del editor** (`monacoTheme`): controla los colores dentro de Monaco
- Ambos son configurables de forma independiente desde Settings

### Temas incluidos

| id        | Label   | isDark |
| --------- | ------- | ------ |
| `light`   | Light   | false  |
| `dark`    | Dark    | true   |
| `dracula` | Dracula | true   |

El tema inicial se infiere **una sola vez** en el primer load desde `prefers-color-scheme`. Dracula nunca se activa automáticamente. La propiedad `isDark` determina qué color de cursor del usuario aplicar (`colorDark` vs `colorLight`).

```js
// constants/themes.js
export const UI_THEMES = [
    { id: 'light', label: 'Light', isDark: false },
    { id: 'dark', label: 'Dark', isDark: true },
    { id: 'dracula', label: 'Dracula', isDark: true },
];
export const MONACO_THEMES = [
    { id: 'light', label: 'Light', isDark: false },
    { id: 'dark', label: 'Dark', isDark: true },
    { id: 'dracula', label: 'Dracula', isDark: true },
];
```

### Estructura en Tailwind v4

```css
/* src/css/themes/dark.css */
[data-theme='dark'] {
    @theme {
        --color-background: #282a36;
        --color-surface: #1e1f29;
        --color-surface-raised: #343746;
        --color-border: #44475a;
        --color-text: #f8f8f2;
        --color-text-muted: #6272a4;
        --color-accent: #bd93f9;
        --color-accent-hover: #a879e6;
        --color-danger: #ff5555;
        --color-warning: #ffb86c;
        --color-success: #50fa7b;
        --font-sans: 'Geist', sans-serif;
        --font-mono: 'Geist Mono', monospace;
        --radius-base: 6px;
    }
}
```

Sin `tailwind.config.js` — Tailwind v4 lee los tokens de `@theme` y genera las utilidades automáticamente.

### Cómo agregar un tema nuevo

1. Crear `src/css/themes/mi-tema.css` con los tokens en `@theme`
2. Importarlo en `src/css/themes/index.css`
3. Registrarlo en `src/constants/themes.js` con `{ id, label, isDark, thumbnail }`

---

## Tipografía

| Rol           | Fuente         |
| ------------- | -------------- |
| UI (sans)     | Geist          |
| UI (mono)     | Geist Mono     |
| Editor Monaco | JetBrains Mono |

```css
/* src/css/index.css */

/* 1. Fuentes — obligatorio antes de Tailwind */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

/* 2. Tailwind */
@import 'tailwindcss';

/* 3. Temas y utilidades */
@import './themes/index.css';
@import './utils.css';
@import './fonts.css';
```

```css
/* src/css/fonts.css */
--font-sans: 'Geist', sans-serif;
--font-mono: 'Geist Mono', monospace;
```

Monaco usa JetBrains Mono via su opción `fontFamily` en la configuración del editor.

---

## Rutas

| Ruta              | Descripción                                               |
| ----------------- | --------------------------------------------------------- |
| `/`               | Home                                                      |
| `/new`            | Crea bin nuevo → redirige a `/editor/:bin-id`             |
| `/editor/:bin-id` | Editor colaborativo                                       |
| `/embed/:bin-id`  | Vista embed, readonly                                     |
| `/settings`       | Página de configuración                                   |
| `/login`          | Importar sesión via JWT (`?token=...`)                    |
| `/user/:uuid`     | Perfil público: avatar, nombre, bins públicos             |
| `/admin/bins`     | Admin: todos los bins con paginación                      |
| `/admin/users`    | Admin: todos los usuarios, nombre, bins, última actividad |

---

## Layout — Desktop

```
┌──┬──────────────────────────────────────────────────────┐
│  │ ↩ ↪ │ [tab1] [tab2] [+]   [overflow▾] [🔱 Fork] [🔗 Share] │
│  ├──────────────────────────────────────────────────────┤
│A │                                                      │
│c │                  Monaco Editor                       │
│t │                                                      │
│B ├──────────────────────────────────────────────────────┤
│a │ Markdown │ Ln 12, Col 4 │ Spaces: 2 │ UTF-8 │ ● Saved │ 👤👤 │ 💡 │ last edit: lazy-panda │
└──┴──────────────────────────────────────────────────────┘
```

### Activity Bar (izquierda)

| Ícono | Acción    |
| ----- | --------- |
| 🏠    | Home      |
| ➕    | Nuevo bin |
| ⚙️    | Settings  |

---

## Layout — Mobile

```
┌─────────────────────────┐
│ [tabs...] [+] [overflow]│
├─────────────────────────┤
│      Monaco Editor      │
├─────────────────────────┤
│ Lang │ Ln,Col │ 👤👤    │
├─────────────────────────┤
│  🏠  │  ➕   │   ⚙️    │  ← oculto con teclado virtual
└─────────────────────────┘
```

### Safari iOS viewport fix

```css
height: 100dvh;
height: calc(var(--vh, 1dvh) * 100); /* fallback Safari < 15.4 */
```

```js
window.visualViewport.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--vh', `${window.visualViewport.height * 0.01}px`);
});
```

---

## Página de Settings (`/settings`)

Página completa con scroll vertical, dividida en secciones:

1. **Identidad** — nombre editable, color de cursor claro/oscuro, preview en vivo
2. **Apariencia** — grid de miniaturas para tema UI y Monaco, selector de idioma
3. **Editor** — font size, tab size, word wrap, line numbers, minimap
4. **Keybindings** — tabla de shortcuts, click para reasignar, reset al default
5. **Prettier** — opciones globales, overrides por lenguaje, opciones de custom languages
6. **AI Completions** — proveedor, modelo, API key, botón Test
7. **Importar / Exportar** — copiar link con settings, aplicar settings de otro usuario, exportar sesión (JWT)

---

## Permisos

| Acción                | Autor | Otros                     | Admin      |
| --------------------- | ----- | ------------------------- | ---------- |
| Editar bin            | ✅    | ✅ si `is_readonly=false` | ✅ siempre |
| Cambiar `is_readonly` | ✅    | ❌                        | ✅         |
| Cambiar `visibility`  | ✅    | ❌                        | ✅         |
| Eliminar bin          | ✅    | ❌                        | ✅         |

- **Admin**: usuario con `VITE_ADMIN_KEY` guardado en localStorage
- El candado junto al título es un **botón toggle** solo para el autor — decorativo para los demás

---

## Features del home

Estructura de arriba a abajo:

### Hero

- Buscador de bins (por título)
- Botón "Crear nuevo bin"
- Perfil: avatar DiceBear (rings), nombre editable, UUID copiable

### Carrusel de tips

JSON de tips generado por el agente. Fondo de color cambiante, iconos, diseño cuidado.

### Empty state

CTA para crear el primer bin si no hay ninguno.

### Tus bins

Bins donde `author_id = uuid`. Preview de syntax highlighting, vistas, visibilidad, favoritos (estrella), fork rápido.

### Compartidos contigo

Bins en `bin_collaborators` donde el usuario no es autor. Al abrir un bin por primera vez se registra automáticamente. Opción de "dejar de seguir" que elimina el registro.

### Footer

Información básica, links relevantes.

---

## Editor — Monaco

### Configuración general

- Tema default: Dracula
- Fuente: JetBrains Mono
- Autocompletado built-in sin Language Servers:
    - JS/TS/JSX/TSX, HTML, CSS, JSON → IntelliSense completo
    - Resto → autocompletado por palabras

### Tabs

- Icono de lenguaje con color (Devicon, fallback `FileIcon` en `ui/icons.js`)
- Icono trash al hover para eliminar archivo (con confirmación)
- Dot cyan cuando el archivo tiene cambios y no está activo
- Botones undo/redo **antes** de las tabs — visibles siempre, deshabilitados sin historial
- Drag & drop para reordenar
- Overflow menu cuando hay muchas tabs
- Doble click para renombrar

### Search / Replace

El widget nativo de Monaco se deshabilita. Se usa `components/shared/search-widget.jsx`:

- Flotante sobre el editor con grip handle
- Drag con `@use-gesture/react`
- Snap a bordes y esquinas (~20px threshold), animado con CSS transition
- Posición persiste en `settings.searchWidget`
- Cierra con `Escape`

---

## Sincronización en tiempo real

### Canales de Supabase Realtime

```
bin:{binId}:file:{fileId}     — sync de Yjs por archivo
bin:{binId}:awareness         — cursores, nombres, archivo activo
```

### Awareness payload

```js
{
  uuid: "...",
  name: "lazy-panda",
  colorLight: "#hex",
  colorDark: "#hex",
  activeFileId: "abc123",
  cursor: { lineNumber, column }
}
```

El color del cursor se elige según `isDark` del tema activo (`colorDark` vs `colorLight`).

### Qué gestiona Yjs en lugar de Monaco

| Responsabilidad      | Quién lo maneja                                                       |
| -------------------- | --------------------------------------------------------------------- |
| Undo / Redo          | `Y.UndoManager` (solo cambios del usuario local via `trackedOrigins`) |
| Historial de cambios | `Y.Doc` — quién editó qué y cuándo                                    |
| Contenido inicial    | `Y.Doc` — al montar el editor el contenido viene del doc              |
| Cursores remotos     | Yjs awareness → decoraciones en Monaco                                |

```js
const yUndoManager = new Y.UndoManager(yText, {
    trackedOrigins: new Set([clientUUID]),
});

editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => yUndoManager.undo());
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => yUndoManager.redo());

yUndoManager.on('stack-item-added', updateUndoRedoButtons);
yUndoManager.on('stack-item-popped', updateUndoRedoButtons);
```

### Regla: todo cambio de contenido pasa por Yjs

**Prohibido:**

- `model.setValue()` después de la inicialización
- Manipulación directa del DOM del editor

**Obligatorio para cambios programáticos** (Prettier, AI completions, etc.):

```js
// ✅ Correcto
editor.executeEdits('source-id', [{ range, text }]);
model.applyEdits([{ range, text }]);

// ❌ Incorrecto
model.setValue(newContent);
```

Casos a vigilar: Prettier → `executeEdits()`, AI completions → inserción via API de Monaco, carga inicial → única excepción donde `setValue` es aceptable.

### Loop prevention

```js
let isApplyingRemoteChange = false;

ydoc.on('update', () => {
    isApplyingRemoteChange = true;
    // aplicar a Monaco
    isApplyingRemoteChange = false;
});

editor.onDidChangeModelContent(() => {
    if (isApplyingRemoteChange) return;
    // broadcastear a Yjs
});
```

---

## Lenguajes soportados

**Primera clase** (con runner): `markdown`, `html`, `css`, `javascript`, `typescript`, `jsx`, `tsx`, `regex`, `http` / `rest`

**Soporte completo** (syntax highlighting): `json`, `yaml`, `toml`, `bash`, `python`, `rust`, `go`, `php`, `java`, `c`, `cpp`, `csharp`, `ruby`, `swift`, `kotlin`, `sql`, `graphql`, `dockerfile`, `xml`

**Custom** (Monarch tokenizer): `.ino` Arduino, `.mcfunction` Minecraft, `.env`, `csv` (columnas por color), `log` (niveles por color)

### Formateo de código

Prettier por defecto. Cada lenguaje registra un `formatter` en `services/languages.js`. Si no tiene soporte, la opción aparece **deshabilitada con nota** — nunca oculta.

Prettier cubre: `javascript`, `typescript`, `jsx`, `tsx`, `css`, `html`, `markdown`, `json`, `yaml`, `graphql`.

### Iconos de lenguajes

Devicon para lenguajes populares. Fallback `FileIcon` (hoja) en `ui/icons.js` para lenguajes sin ícono o `null`.

---

## Sistema de runners

```js
{
  id: 'javascript',
  label: 'Run',
  icon: PlayIcon,
  component: JsReplRunner,
  languages: ['javascript', 'typescript', 'jsx', 'tsx'],
}
```

Runners: `markdown`, `html`, `javascript / typescript / jsx / tsx`, `regex`, `http / rest`

El botón de runner en la tab bar togglea `?runner` en la URL. En desktop → `ResizablePanel`, en mobile → `Drawer`.

### Resolución de imports entre archivos (`./`)

`helpers/import-resolver.js` reemplaza `./nombre.ext` con el contenido del archivo correspondiente del bin antes de ejecutar.

---

## Runner HTTP (`.http` / `.rest`)

```http
### Obtener usuarios
GET https://myapi.com/users
Authorization: Bearer token123

### Crear usuario
POST https://myapi.com/users
Content-Type: application/json

{
  "name": "Daniel",
  "email": "daniel@example.com"
}
```

Múltiples requests separados por `###`. Cada uno ejecutable individualmente o en secuencia.

Las peticiones van via proxy (`VITE_PROXY_URL` → `/proxy/custom` de `dannegm/endpoints`) — resuelve CORS.

> ⚠️ Algunas APIs con restricciones estrictas de IP, certificados o detección de proxies pueden no responder como se espera.

Output: status code + tiempo, headers colapsables, body con syntax highlighting, historial de la sesión.

---

## Paquetes npm (JS/TS/JSX/TSX)

CDN: **`esm.sh`** — sirve paquetes como ES modules directamente en browser.

El runner inyecta los imports via esm.sh antes de ejecutar. Los paquetes se guardan en `bins.bins.packages` como JSONB.

### Detección automática

Monaco detecta `import ... from 'pkg'` y `require('pkg')` — filtra relativos y built-ins. Los no instalados se resaltan con decoración de color + lightbulb sugiriendo "Agregar al bin".

### Modal de paquetes

Búsqueda via npm registry API, selector de versión, lista de instalados con opción de eliminar.

---

## Fork

Al forkear se crea una copia con `forked_from` apuntando al ID del original (`on delete set null`).

En el editor, badge junto al título:

- **"Fork de [nombre]"** — clickeable, navega al original
- **"Fork de bin eliminado"** — si el original fue borrado

---

## Guardado y ciclo de vida del bin

- Debounce de **1.5s** después de la última edición
- No guarda si el contenido es solo el placeholder
- `cmd+s` / `ctrl+s` fuerza guardado inmediato
- Estados en status bar: `Saving...` → `Saved` → `Unsaved changes`
- Flag `hasBeenSaved` activo en el primer guardado exitoso

Al crear un bin se asigna `expires_at` a 5 minutos. En el primer guardado se actualiza a `null`. El cron job limpia los expirados. `beforeunload` borra el bin si `hasBeenSaved` es false — best effort, no confiable en iOS.

### Ruta `/new`

Crea el bin y redirige. Primer archivo `README.md` con placeholder:

```markdown
**Welcome to your new bin** — start typing or paste your code here. You can:

- Add more files with the **+** button in the tab bar
- Change the language from the status bar below
- Share this bin with the **Share** button — anyone with the link can view it
- Collaborate in real time — share the link and edit together
- Open the command palette with **⌘K** / **Ctrl+K** for more options
```

El shortcut se genera dinámicamente según OS via `navigator.platform`.

---

## Favicon y document.title

Solo activos en `/editor/:bin-id`.

### `document.title`

| Estado           | Título                    |
| ---------------- | ------------------------- |
| Normal           | `bin name - file name`    |
| Cambios sin foco | `✏️ bin name - file name` |
| Nudge sin foco   | `💡 bin name - file name` |

### Dot en tabs

Dot cyan en la tab cuando el archivo tiene cambios y no está activo. Desaparece al activar la tab.

### Favicon (`use-favicon.js`)

Hook custom via canvas. El autor proporciona `favicon-light.png` y `favicon-dark.png` (32x32). El hook elige según `isDark` del tema activo.

| Estado           | Dot                     |
| ---------------- | ----------------------- |
| Normal           | sin dot                 |
| Cambios sin foco | cyan                    |
| Nudge sin foco   | amarillo                |
| Offline          | rojo (prioridad máxima) |

---

## Sistema de comandos (`useCommands`)

El command palette no ejecuta lógica — emite eventos via `useEvent()`.

### `useCommands`

Listener global montado en `__root.jsx`. Encapsula comandos que aplican desde cualquier contexto: nudge, nuevo bin, ir al home, etc.

```js
export const useCommands = () => {
    const { on } = useEvent();
    on('app:new-bin', () => {
        /* navegar a /new */
    });
    on('app:go-home', () => {
        /* navegar a / */
    });
    on('app:nudge', () => {
        /* sonido + shake + vibración */
    });
    on('bin:share', () => {
        /* copiar link al clipboard */
    });
};
```

### Scope de comandos

```js
{ id: 'app.new-bin',   scope: '*' }
{ id: 'editor.format', scope: ['/editor'] }
{ id: 'bin.share',     scope: ['/editor', '/embed'] }
```

Filtra con `scope === '*' || scope.some(s => currentRoute.startsWith(s))`.

### Comandos locales

Los comandos de contexto específico (cambiar lenguaje, formatear, toggle minimap) los maneja cada componente con `useEvent()` directamente.

---

## Command Palette (`cmd+k`)

Filtra por `scope` según ruta activa, emite eventos, no ejecuta lógica.

**Navegación**

- Ir al home
- Nuevo bin `cmd+n`
- Nuevo archivo en el bin actual `cmd+shift+n`
- Ir a settings `cmd+,`
- Ir a mi perfil

**Archivo activo**

- Cambiar lenguaje
- Renombrar archivo
- Eliminar archivo activo (con confirmación)
- Descargar archivo
- Descargar ZIP

**Paquetes** _(solo JS/TS/JSX/TSX)_

- Abrir gestor de paquetes

**Bin**

- Copiar link `cmd+shift+c`
- Forkear
- Eliminar (solo autor / admin)
- Cambiar visibilidad (público / unlisted)
- Cambiar modo lectura / escritura

**Runner**

- Abrir / cerrar runner `opt+shift+r`

**Editor**

- Activar / desactivar word wrap `opt+shift+w`
- Activar / desactivar minimap
- Cambiar font size
- Cambiar indentación (tabs vs espacios, cantidad)
- Formatear código `opt+shift+f` — deshabilitado con nota si sin soporte
- Abrir search `cmd+f`
- Abrir search & replace `cmd+h`

**Apariencia**

- Cambiar tema UI
- Cambiar tema Monaco
- Cambiar idioma

**Usuario**

- Copiar mi UUID
- Editar mi nombre

---

## Keybindings

### Globales (`useHotkeys`)

`cmd+w` se intercepta para evitar que el browser cierre la pestaña.

| Shortcut      | Acción                         |
| ------------- | ------------------------------ |
| `cmd+k`       | Command palette                |
| `cmd+,`       | Settings                       |
| `cmd+n`       | Nuevo bin                      |
| `cmd+shift+n` | Nuevo archivo en el bin actual |
| `cmd+shift+[` | Tab anterior                   |
| `cmd+shift+]` | Tab siguiente                  |
| `cmd+shift+c` | Copiar link del bin            |
| `opt+shift+r` | Abrir / cerrar runner          |
| `opt+shift+f` | Formatear código               |
| `opt+shift+w` | Toggle word wrap               |

### Monaco (nativos, no reimplementar)

`undo`, `redo`, `opt+up/down`, `cmd+d`, `cmd+f`, `cmd+h`, `cmd+/`, `alt+click`, selección múltiple

### Monaco (remapeables desde settings)

`redo` → default `cmd+shift+z`, override ejemplo `cmd+y`

---

## Paneles responsivos

El estado de los paneles vive en la URL como query param — compartible. Los modales son estado local salvo indicación.

### Runner panel

- **Desktop**: `ResizablePanel` de shadcn, tamaño persiste en `settings.runnerPanel`
- **Mobile**: `Drawer` de shadcn, swipe para cerrar cambia `?runner` a false

**Query param**: `?runner` (via `parseAsShorthandBoolean` de `helpers/parsers.js`)

```js
export const parseAsShorthandBoolean = createParser({
    parse(value) {
        if (value === null || value === '0' || value === 'false' || value === 'no') return false;
        return true;
    },
    serialize(value) {
        return value ? '' : null;
    },
}).withDefault(false);
```

### Modales

`ui/responsive-modal.jsx` — `Dialog` en desktop, `Drawer` en mobile.

---

## TanStack Query

Capa de server state para todas las interacciones con Supabase.

```js
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: true,
            retry: 2,
        },
    },
});
```

- **Caché** — bin ya cargado no se vuelve a pedir
- **Optimistic updates** — toggle candado, cambiar nombre, visibilidad
- **Refetch automático** — al recuperar foco y tras offline
- **Rollback automático** si falla una mutation

---

## Sistema de eventos interno (BusProvider)

El autor proporcionará `BusProvider` (`providers/bus-provider.jsx`). Bus de eventos local — sin relación con ntfy.

```js
const { emit, on } = useEvent()

emit('bin:created', { id: 'xK3mPq' })
on('bin:created', (data) => { ... })
```

Puede combinarse con ntfy para reaccionar a eventos remotos dentro del árbol de componentes.

---

## Sistema de comandos (ntfy)

Canal pub/sub global. Todos los clientes suscriben y emiten. El filtrado por destinatario es client-side.

### Formato

```
command:<nombre>
command:<nombre>()
command:<nombre>(valor)
command:<nombre>({clave: valor})
command:<nombre>()|to[uuid,uuid]
command:<nombre>(params)|to[uuid]
```

`|to[...]` es modificador opcional. El parser divide por `|`.

### Integración

La capa de abstracción (`services/ntfy.js`) es proporcionada por el autor. `services/commands.js` se construye sobre ella:

- `sendCommand(name, params?)`
- `sendCommandTo(uuids, name, params?)`
- `onCommand(name, handler)`
- Parser a `{ to, name, params }`

### Easter egg — nudge MSN 🔔

`command:nudge` → sonido MSN + shake animation en el contenedor principal + `navigator.vibrate()` en móvil.

---

## Exportar / Importar sesión

### Exportar

Botón en Settings → genera `/login?token=eyJ...`:

- JWT firmado con `{ uuid }` usando `VITE_SESSION_SECRET`
- Expiración: 15 minutos
- Se copia al clipboard con toast

### Importar (`/login?token=...`)

1. Verificar y decodificar el JWT
2. Extraer `uuid`
3. Sobreescribir el `uuid` en localStorage
4. Redirigir al home

### ⚠️ Advertencia

`VITE_SESSION_SECRET` es pública en el bundle — visible en el código del cliente. Aceptable para uso personal/self-hosted.

---

## AI Completions

Desactivado por default. El usuario configura su propio proveedor en Settings — todo en localStorage, las keys nunca salen del dispositivo.

### Proveedores

| Proveedor          | Modelo default      | Modelos prefabricados                 |
| ------------------ | ------------------- | ------------------------------------- |
| Claude (Anthropic) | `claude-sonnet-4-6` | opus, sonnet, haiku + "Otro"          |
| OpenAI             | `gpt-4o-mini`       | gpt-4o, gpt-4o-mini, o3-mini + "Otro" |
| Gemini (Google)    | `gemini-2.0-flash`  | flash, pro + "Otro"                   |
| OpenRouter         | configurable        | input libre                           |
| Ollama (local)     | configurable        | input libre                           |
| Custom             | configurable        | —                                     |

### Proveedor Custom — Nivel 1 (JSON)

```js
const CustomProviderSchema = z.object({
    baseUrl: z.string().url(),
    endpoint: z.string().startsWith('/'),
    headers: z.record(z.string()).optional(),
    bodyTemplate: z.record(z.unknown()),
    responsePath: z.string(), // dot notation, ej: choices.0.message.content
});
```

Editor `code-editor-simple.jsx` en modo JSON con validación Zod al guardar. Documentación inline colapsable con ejemplos de `responsePath` y ejemplo funcional de LM Studio.

`responsePath` usa dot notation via `helpers/objects.js` (proporcionado por el autor).

### Proveedor Custom — Nivel 2 (JS)

`new Function` — máxima flexibilidad.

> ⚠️ Ejecuta código JavaScript arbitrario. Solo si sabes lo que estás haciendo.

### Adapters

```js
const adapters = {
    claude: async (code, offset, settings) => {
        /* → data.content[0].text */
    },
    openai: async (code, offset, settings) => {
        /* → data.choices[0].message.content */
    },
    gemini: async (code, offset, settings) => {
        /* → data.candidates[0].content.parts[0].text */
    },
    openrouter: async (code, offset, settings) => {
        /* → data.choices[0].message.content */
    },
    ollama: async (code, offset, settings) => {
        /* → data.response */
    },
};

export const getCompletions = (code, offset, settings) => {
    return adapters[settings.provider](code, offset, settings);
};
```

El `registerCompletionItemProvider` se registra para todos los lenguajes. Si AI está desactivado, devuelve vacío sin llamar al adapter.

---

## Internacionalización (i18n)

`react-i18next`. Idiomas: `en` (default), `es`. "Solicitar idioma" abre un issue en el repo — **link TODO, proporcionado por el autor**.

Al primer uso se infiere de `navigator.language`. Monaco i18n via `monaco-editor/esm/vs/nls` sigue el idioma activo.

Nunca hardcodear strings de UI — siempre `useTranslation()`.

---

## Estados especiales de UI

### Error Boundary — BSOD

Fondo azul clásico, fuente monospace, código de error fake `BINS_KERNEL_PANIC_0x000000FF`, stack trace colapsable, botón "Reiniciar" → `window.location.reload()`.

### Loading — Code Scramble

Para carga del editor: caracteres aleatorios que respetan estructura (indentación, espacios) y se "resuelven" progresivamente al contenido real. Implementado en `hooks/use-code-scramble.js`. Para el resto: skeletons de shadcn.

### Offline

Toast de advertencia + dot rojo en favicon (prioridad máxima) + indicador en status bar + sync de Yjs pausado.

### Límites

- 500KB máximo por archivo (~8,000-12,000 líneas)
- 10 archivos máximo por bin
- Toast de aviso al acercarse o alcanzar el límite

### Tips

JSON de tips generado por el agente con contenido basado en las features de la app.

**Home**: carrusel de tips con fondo de color cambiante, iconos, diseño cuidado.

**Editor**: icono 💡 en el status bar — click muestra un tip aleatorio flotante. Aparece automáticamente en cada refresh (configurable en settings, se puede desactivar).

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ADMIN_KEY=          # opcional — habilita modo admin
VITE_PROXY_URL=          # ej: https://endpoints.hckr.mx/proxy/custom
VITE_SESSION_SECRET=     # clave para firmar JWTs de transferencia de sesión
```

### Vercel

```json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Tareas previas al desarrollo

### Supabase

**Proyecto**

- [ ] Crear proyecto en Supabase
- [ ] Copiar `SUPABASE_URL` y `SUPABASE_ANON_KEY` para el `.env`

**Schema**

1. SQL Editor → `create schema if not exists bins;`
2. Ejecutar grants de permisos para `anon`, `authenticated`, `service_role` sobre el schema `bins`
3. Dashboard → Settings → API → **Exposed schemas** → agregar `bins` → guardar (~30s para reiniciar PostgREST)

```sql
GRANT USAGE ON SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA bins TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bins TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bins GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```

- [x] Crear schema `bins`
- [x] Agregar `bins` a Exposed schemas
- [x] Crear tabla `bins.profiles`
- [x] Crear tabla `bins.bins`
- [x] Crear tabla `bins.bin_files`
- [x] Crear tabla `bins.bin_collaborators`
- [x] Agregar constraint `bin_file_max_size`
- [x] Crear función y trigger `enforce_bin_files_limit`
- [x] Ejecutar SQL de RLS
- [x] Habilitar `pg_cron` desde Dashboard → Database → Extensions
- [x] Registrar cron job de limpieza
- [x] Habilitar Realtime para las tablas necesarias

**Extensiones**

```sql
create extension if not exists pg_cron with schema cron;
```

**Realtime**

- [ ] Habilitar Realtime en Supabase
- [ ] Configurar canales de broadcast para sync de Yjs y awareness

### Vercel

- [ ] Crear proyecto conectado al repo
- [ ] Configurar variables de entorno
- [ ] Crear `vercel.json` con rewrites
- [ ] Configurar dominio `bins.hckr.mx`

### Repo `dannegm/endpoints`

- [x] Endpoint `/proxys/custom` ya disponible en `https://endpoints.hckr.mx/proxys/custom`

El target completo (path + query) va en el header `x-proxy-target`:

```bash
# GET
curl 'https://endpoints.hckr.mx/proxys/custom' \
     -H 'x-proxy-target: https://endpoints.hckr.mx/starfish/otp'

# POST
curl -X POST 'https://endpoints.hckr.mx/proxys/custom' \
     -H 'x-proxy-target: https://api.example.com/users?active=true' \
     -H 'Content-Type: application/json' \
     -d '{"name":"dan"}'
```

### Repositorio de Bins

- [x] Crear repo en GitHub
- [x] Configurar `.gitignore` (`.env`, `node_modules`, `dist`)
- [x] Crear `.env.example`

### Assets a preparar

- [x] `favicon.svg`
- [x] `favicon-light.png` (32x32)
- [x] `favicon-dark.png` (32x32)
- [x] `assets/sounds/` — sonido nudge MSN

### Código a proporcionar

- [ ] `services/ntfy.js` — capa de abstracción ntfy
- [ ] `providers/bus-provider.jsx` con hook `useEvent()`
- [ ] Componente base para `ui/icons.js`

---

## Fases de desarrollo

### Fase 1 — MVP

1. Scaffold (Vite + React + Tailwind v4 + shadcn/Base UI + TanStack Router)
2. Sistema de temas (`css/themes/`, `ThemeProvider`, `data-theme`)
3. Setup Supabase (schema, `services/supabase.js`)
4. Identidad anónima (`services/settings.js`, `providers/identity-provider.jsx`)
5. Crear bin → `/new` → redirigir a `/editor/:id`
6. Monaco básico con tema Dracula
7. Persistencia de contenido en DB
8. Multiarchivo con tabs
9. Yjs + binding Monaco (sin red)
10. Sync via Supabase Realtime (awareness + cursores)
11. Persistencia de `ydoc_state`
12. Home con hero, tus bins, compartidos contigo
13. Página de Settings con miniaturas
14. Share (copy link + toast), Fork
15. Command palette + keybindings globales
16. AI Completions

### Fase 2 — Runners

17. Markdown runner
18. HTML runner + import resolver
19. JS/TS/JSX/TSX REPL (sucrase)
20. Regex playground (regexp-tree + railroad diagrams)
21. HTTP runner + proxy

### Fase 3 — Polish

22. Embed (`/embed/:id`)
23. Lenguajes custom (Arduino, Minecraft, CSV, .env, logs)
24. Descarga individual y ZIP
25. Paquetes npm (esm.sh)
26. Expiración de bins
27. Modo admin (`/admin/bins`, `/admin/users`)
28. Mobile nav + Safari fix
29. Modo presentación (fullscreen)

### Fase 4 — Futuras

- Comentarios inline por línea
- Diff view entre archivos o bins
- Detección automática de lenguaje
- CSS preview, SVG preview
- Más temas UI
