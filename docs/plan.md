# Bins — Especificación v1.0

**Nombre:** Bins
**Dominio:** `bins.hckr.mx`
**Deploy:** Vercel
**Plataformas:** Desktop y mobile — prioridad desktop

---

## Índice

1. [Reglas de código y convenciones](#reglas-de-código-y-convenciones)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Base de datos](#base-de-datos-supabase)
5. [Identidad anónima y Settings](#modelo-de-identidad-anónima)
6. [Sistema de temas](#sistema-de-temas)
7. [Tipografía](#tipografía)
8. [Rutas](#rutas)
9. [Layout](#layout)
10. [Página de Settings](#página-de-settings)
11. [Permisos](#permisos)
12. [Home](#home)
13. [Editor — Monaco](#editor--monaco)
14. [Sincronización en tiempo real](#sincronización-en-tiempo-real)
15. [Lenguajes soportados](#lenguajes-soportados)
16. [Sistema de runners](#sistema-de-runners)
17. [Runner HTTP](#runner-http)
18. [Paquetes npm](#paquetes-npm)
19. [Fork](#fork)
20. [Guardado y ciclo de vida del bin](#guardado-y-ciclo-de-vida-del-bin)
21. [Favicon y document.title](#favicon-y-documenttitle)
22. [Command Palette y keybindings](#command-palette-y-keybindings)
23. [Paneles responsivos](#paneles-responsivos)
24. [TanStack Query](#tanstack-query)
25. [Sistema de eventos (BusProvider + ntfy)](#sistema-de-eventos)
26. [Exportar / Importar sesión](#exportar--importar-sesión)
27. [AI Completions](#ai-completions)
28. [Internacionalización](#internacionalización)
29. [Estados especiales de UI](#estados-especiales-de-ui)
30. [Variables de entorno](#variables-de-entorno)

---

## Reglas de código y convenciones

- **Solo JavaScript** — sin TypeScript en ningún archivo
- **`export const`** para todas las funciones y variables exportadas; `export default` solo en `app.jsx`
- Variables `useRef` con prefijo `$` y sin sufijo `Ref` (ej: `$editor`, `$container`)
- `async/await` sobre `.then()/.catch()`
- Componentes en PascalCase, hooks en camelCase con prefijo `use`
- Archivos de componentes en `kebab-case.jsx`, utils en `kebab-case.js`
- **Todas las carpetas y archivos en kebab-case** sin excepción
- Sin comentarios obvios — el código debe ser autoexplicativo
- **`cn()` siempre** para clases de Tailwind — importar de `@/helpers/utils.js`
- **Sin colores hardcodeados** — siempre tokens semánticos (`text-brand`, `bg-surface`, etc.)
- **Sin strings de UI hardcodeados** — siempre `useTranslation()`
- **Una instancia de `useTranslation()` por archivo** — pasarla como prop a sub-componentes del mismo archivo

---

## Stack tecnológico

| Capa                  | Herramienta                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| Framework             | Vite + React                                                             |
| Estilos               | Tailwind CSS v4                                                          |
| Componentes           | shadcn/ui con **Base UI** (`@base-ui/react`) — Radix solo como fallback  |
| Toasts                | sonner                                                                   |
| Editor                | Monaco Editor (`vite-plugin-monaco-editor`)                              |
| CRDT / Sync           | Yjs                                                                      |
| Transporte realtime   | Supabase Realtime (Broadcast)                                            |
| Base de datos         | Supabase (PostgreSQL, schema `bins`)                                     |
| Server state          | TanStack Query                                                           |
| Estado URL            | nuqs                                                                     |
| Routing               | TanStack Router (file-based, plugin de Vite)                             |
| Hotkeys               | `useHotkeys`                                                             |
| Command palette       | `cmdk` (shadcn)                                                          |
| Gestos / drag         | `@use-gesture/react`                                                     |
| Paneles resizables    | `react-resizable-panels` (via shadcn Resizable)                          |
| TS/JSX transpile      | sucrase (browser, para REPL)                                             |
| Formatter             | Prettier                                                                 |
| IDs cortos            | nanoid                                                                   |
| Nombres anónimos      | `adjective-animal` autogenerado                                          |
| ZIP download          | JSZip                                                                    |
| Avatares              | DiceBear (estilo `rings`, seed = UUID)                                   |
| Iconos de lenguajes   | Devicon (SVG/font, con color)                                            |
| Internacionalización  | `react-i18next`                                                          |
| JWT (sesión)          | `jose`                                                                   |
| Pub/sub comandos      | ntfy (capa de abstracción propia)                                        |
| AI Completions        | Claude / OpenAI / Gemini / OpenRouter / Ollama (configurable)            |
| Diagramas             | Mermaid                                                                  |
| Live coding           | Strudel                                                                  |

---

## Estructura del proyecto

```
src/
  routes/
    __root.jsx                      — Layout global, monta providers
    index.jsx                       — Home
    editor.jsx                      — Layout del editor (nested)
    editor.index.jsx                — Redirect a /new si no hay bin
    editor.$binId.jsx               — Editor colaborativo principal
    embed.$binId.jsx                — Vista embed (readonly)
    fork.$binId.jsx                 — Página de fork con animación
    settings.jsx                    — Página de configuración
    user.$uuid.jsx                  — Perfil público de usuario
    login.jsx                       — Importar sesión via JWT
    new.jsx                         — Crear bin → redirige al editor
    admin.index.jsx                 — Admin: redirect a /admin/bins
    admin.bins.jsx                  — Admin: listado de todos los bins
    admin.users.jsx                 — Admin: listado de todos los usuarios
    admin.tips.jsx                  — Admin: gestión de tips

  pages/
    home.jsx
    editor.jsx
    embed.jsx
    fork.jsx
    settings.jsx
    login.jsx
    new.jsx
    user.jsx
    admin-bins.jsx
    admin-users.jsx
    admin-tips.jsx
    forgotten.jsx                   — Página de error "bin olvidado"
    playground.jsx                  — Sandbox de desarrollo

  components/
    editor/
      monaco-editor.jsx             — Monaco + Yjs binding
      tab-bar.jsx                   — Tabs, renombrar, reordenar, overflow, drag & drop
      status-bar.jsx                — Lenguaje, línea/col, sync, usuarios activos
      runner-panel.jsx              — Panel derecho (ResizablePanel desktop / Drawer mobile)
      bin-header.jsx                — Título, fork badge, share, fork buttons
      editor-core.jsx               — Composición del layout del editor
      editor-skeleton.jsx           — Skeleton de carga
      embed-dialog.jsx              — Modal de embed code
      embed-monaco-editor.jsx       — Monaco recortado para embed
      file-drop-overlay.jsx         — Drop zone para abrir archivos locales
      packages-drawer.jsx           — Drawer de gestión de paquetes npm

    runners/
      markdown-runner.jsx
      html-runner.jsx               — iframe sandboxed con import resolver
      js-runner.jsx                 — REPL con console output (JS/TS/JSX/TSX, sucrase)
      http-runner.jsx               — Cliente HTTP tipo Postman, via proxy
      csv-runner.jsx                — Tabla con columnas por color
      json-runner.jsx               — Vista árbol coloreada
      yaml-runner.jsx               — Vista árbol coloreada
      toml-runner.jsx               — Vista árbol coloreada
      xml-runner.jsx                — Vista árbol coloreada
      svg-runner.jsx                — Preview SVG
      mermaid-runner.jsx            — Diagramas Mermaid
      strudel-runner.jsx            — Live coding musical
      whatsapp-runner.jsx           — Preview de chat WhatsApp

    settings/
      identity-section.jsx
      appearance-section.jsx        — Tema UI y Monaco con miniaturas
      editor-section.jsx
      keybindings-section.jsx
      prettier-section.jsx
      ai-completions-section.jsx
      import-export-section.jsx
      settings-nav.jsx
      settings-ui.jsx

    bins/
      bin-card.jsx
      lang-dot.jsx

    home/
      home-header.jsx
      my-bins.jsx
      shared-bins.jsx

    user/
      profile-header.jsx
      profile-bins.jsx
      profile-shared-bins.jsx

    admin/
      admin-layout.jsx
      bins-table.jsx
      users-table.jsx
      tips-table.jsx

    layout/
      layout.jsx
      sidebar.jsx
      app-icon.jsx
      footer.jsx

    system/
      command-palette.jsx
      search-widget.jsx             — Widget flotante drag+snap, posición en settings
      error-boundary.jsx            — BSOD estilizado
      tips-carousel.jsx             — Carrusel de tips para el home
      scramble-text.jsx             — Animación scramble de texto
      user-avatar.jsx               — Avatar DiceBear rings desde UUID
      toast.jsx
      nyan-cat.jsx                  — Easter egg
      coffee-loader.jsx
      maintenance-screen.jsx

  ui/
    button.jsx, input.jsx, switch.jsx, tooltip.jsx, dialog.jsx
    drawer.jsx, sheet.jsx, popover.jsx, select.jsx
    badge.jsx, separator.jsx, scroll-area.jsx, skeleton.jsx
    table.jsx, checkbox.jsx, textarea.jsx, collapsible.jsx
    command.jsx, resizable.jsx, sidebar.jsx
    color-picker.jsx, color-selector.jsx
    number-scrubber.jsx, inline-value.jsx, input-group.jsx
    kbd.jsx, empty.jsx
    themed-json-view.jsx
    icons.jsx                       — SVGs custom
    animated-beam.jsx, dot-grid-spotlight.jsx, flickering-grid.jsx, noise-overlay.jsx

  providers/
    providers.jsx                   — Árbol global de providers
    theme-provider.jsx              — Aplica data-theme al <html>
    identity-provider.jsx           — UUID, nombre, colores del usuario anónimo
    query-provider.jsx              — TanStack Query client
    bus-provider.jsx                — Bus de eventos interno
    device-provider.jsx             — Detección de mobile/desktop
    maintenance-provider.jsx        — Modo mantenimiento
    headless-guard.jsx              — Detecta bots/headless y los bloquea
    forgotten-provider.jsx          — Bins "olvidados" (no guardados)
    editor-events-provider.jsx      — Eventos del editor
    nudge-provider.jsx              — Lógica del easter egg nudge
    packages-provider.jsx           — Estado de paquetes npm
    command-palette-provider.jsx    — Estado del command palette
    toast-provider.jsx
    global-dropzone-provider.jsx    — Drag & drop global de archivos
    embed-providers.jsx
    embed-theme-provider.jsx

  helpers/
    utils.js                        — cn() + utilidades generales
    arrays.js, strings.js, objects.js, parsers.js
    identity.js                     — Generación de UUID + nombre adjective-animal
    avatar.js                       — DiceBear helper
    jwt.js                          — Firma y verificación de JWT
    monaco.js                       — Helpers específicos de Monaco
    monaco-languages.js             — Monarch tokenizers para lenguajes custom
    providers.js                    — createProviders() helper
    redirect.js
    ua-parser.js                    — Parser de user agent
    languages/
      csv.js, http.js, mermaid.js, whatsapp.js  — Helpers específicos por runner

  services/
    settings.js                     — CRUD de settings en localStorage
    supabase.js                     — Cliente Supabase + $schema
    bins.js                         — Queries de bins
    bin-files.js                    — Queries de archivos
    bin-collaborators.js
    profiles.js
    yjs.js                          — Inicialización Y.Doc + provider por archivo
    runners.js                      — Registro de runners por lenguaje
    ai-completions.js
    commands.js                     — Sistema de comandos ntfy
    ntfy.js                         — Capa de abstracción ntfy
    i18n.js

  hooks/
    use-identity.js
    use-settings.js
    use-admin.js
    use-favicon.js
    use-document-title.js
    use-hotkey.js
    use-mobile.js
    use-ntfy.js
    use-debounce-callback.js
    use-debounced-effect.js
    use-local-storage.js
    use-global-commands.js
    use-external-commands.js
    use-keybinding-commands.js
    use-ai-completions.js

  constants/
    languages.js
    themes.js
    default-settings.js
    commands.js
    tips.js
    visibility.js
    word-lists.js
    json-view-themes.js

  locales/
    en.json
    es.json

  css/
    index.css                       — Entry point
    utils.css
    variants.css
    themes/
      index.css
      dark.css, light.css, dracula.css, rose-pine-dawn.css
      tlapalli-quartz.css, tlapalli-fire-opal.css
```

---

## Base de datos (Supabase)

### Schema

```sql
create schema if not exists bins;
```

### Tablas

```sql
-- Perfiles de usuarios anónimos
create table bins.profiles (
  uuid         uuid primary key,
  name         text not null,
  color_light  text not null default '#e67e22',
  color_dark   text not null default '#f39c12',
  ip_hash      text,
  country      text,
  city         text,
  user_agent   text,
  is_bot       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz default now()
);

-- Bins
create table bins.bins (
  id            text primary key,           -- nanoid corto
  title         text default 'Untitled',
  author_id     uuid not null references bins.profiles(uuid) on delete cascade,
  visibility    text default 'public',      -- 'public' | 'unlisted'
  is_readonly   boolean default true,
  views         int default 0,
  expires_at    timestamptz,
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

### Constraints

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

### Row Level Security

RLS sin auth: el UUID del cliente se envía como header `x-client-id` en cada request.

```sql
alter table bins.bins              enable row level security;
alter table bins.bin_files         enable row level security;
alter table bins.bin_collaborators enable row level security;

-- BINS: lectura pública + unlisted
create policy "bins: lectura pública" on bins.bins for select
  using (visibility = 'public');
create policy "bins: lectura unlisted" on bins.bins for select
  using (visibility = 'unlisted');

-- BINS: escritura solo al autor
create policy "bins: insertar propio" on bins.bins for insert
  with check (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);
create policy "bins: actualizar propio" on bins.bins for update
  using (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);
create policy "bins: eliminar propio" on bins.bins for delete
  using (author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);

-- BIN_FILES: lectura si el bin es accesible
create policy "bin_files: lectura" on bins.bin_files for select
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

-- BIN_FILES: escritura si el bin lo permite
create policy "bin_files: insertar" on bins.bin_files for insert
  with check (
    exists (
      select 1 from bins.bins where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );
create policy "bin_files: actualizar" on bins.bin_files for update
  using (
    exists (
      select 1 from bins.bins where bins.bins.id = bin_files.bin_id
      and (
        bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
        or bins.bins.is_readonly = false
      )
    )
  );
create policy "bin_files: eliminar" on bins.bin_files for delete
  using (
    exists (
      select 1 from bins.bins where bins.bins.id = bin_files.bin_id
      and bins.bins.author_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
    )
  );

-- BIN_COLLABORATORS
create policy "bin_collaborators: lectura" on bins.bin_collaborators for select
  using (
    exists (
      select 1 from bins.bins
      where bins.bins.id = bin_collaborators.bin_id
      and bins.bins.visibility in ('public', 'unlisted')
    )
  );
create policy "bin_collaborators: registrarse" on bins.bin_collaborators for insert
  with check (
    user_id = (current_setting('request.headers')::json->>'x-client-id')::uuid
    and exists (
      select 1 from bins.bins
      where bins.bins.id = bin_collaborators.bin_id
      and bins.bins.visibility in ('public', 'unlisted')
    )
  );
create policy "bin_collaborators: dejar de seguir" on bins.bin_collaborators for delete
  using (user_id = (current_setting('request.headers')::json->>'x-client-id')::uuid);
```

### Índices

```sql
create index if not exists idx_profiles_is_bot on bins.profiles (is_bot);
```

### Cron jobs

```sql
-- Cada 5 minutos: borrar bins expirados
select cron.schedule('cleanup-expired-bins', '*/5 * * * *',
  $$ delete from bins.bins where expires_at is not null and expires_at < now(); $$
);

-- Cada lunes a las 3am: borrar perfiles de bots
select cron.schedule('delete-bot-profiles', '0 3 * * 1',
  $$ delete from bins.profiles where is_bot = true $$
);
```

### Cliente Supabase

```js
// services/supabase.js
const supabase = createClient(url, key, {
    global: { headers: { 'x-client-id': uuid } },
});

export const $schema = supabase.schema('bins');
```

### Notas

- `is_readonly = true` por default — solo el autor puede editar
- El admin (usuario con `VITE_ADMIN_KEY` en localStorage) puede editar y eliminar cualquier bin
- `ydoc_state` persiste el estado Yjs para usuarios que entran tarde
- `content` es snapshot de texto plano para preview sin cargar Yjs
- El fingerprint (`ip_hash`, `country`, `city`, `user_agent`, `is_bot`) se registra solo en el primer visit
- `ip_hash` es SHA-256 del IP — nunca se guarda el IP crudo
- `is_bot` se detecta client-side: `navigator.webdriver === true` o patrones en UA

---

## Modelo de identidad anónima

Sin autenticación. Cada usuario tiene un UUID generado en el primer visit y guardado en `localStorage`.

### Schema de settings

```js
{
  user: {
    uuid: "550e8400-...",         // generado una vez, nunca cambia
    name: "lazy-panda",           // editable
    colorLight: "#e67e22",
    colorDark: "#f39c12",
  },

  language: 'en',
  uiTheme: 'dark',
  monacoTheme: 'dark',

  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  lineNumbers: true,
  minimap: false,

  searchWidget: { x: 0, y: 0 },
  runnerPanel: { layouts: {} },      // tamaño por bin

  tipsEnabled: true,
  binView: {
    myBins: 'grid',                  // 'grid' | 'list'
    sharedBins: 'grid',
    profileBins: 'grid',
    profileSharedBins: 'grid',
  },

  favoritePackages: [],

  aiCompletions: {
    enabled: false,
    provider: 'ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    model: '',
  },

  appKeybindings: {
    command_palette: 'mod+shift+p',
    settings: 'mod+,',
    new_bin: 'alt+n',
    new_file: 'alt+shift+n',
    prev_tab: 'mod+shift+[',
    next_tab: 'mod+shift+]',
    copy_link: 'mod+shift+c',
    toggle_runner: 'alt+shift+r',
    format_code: 'alt+shift+f',
  },

  monacoKeybindings: {
    redo: 'mod+y',
  },

  prettier: {
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    bracketSpacing: true,
    arrowParens: 'avoid',
    jsxSingleQuote: true,
  }
}
```

### Ciclo de vida de identidad

1. Al arrancar → upsert silencioso de `{ uuid, name, color_light, color_dark }` en `bins.profiles`
2. Si es el **primer visit** → recoger fingerprint vía `ip-api.com` + `navigator.userAgent` + `navigator.webdriver` → UPDATE `bins.profiles`
3. Al cambiar nombre o colores → upsert inmediato en `bins.profiles`

### URL sharing (`/settings?config=...`)

El JSON se serializa con `nuqs` en el query param `config`. Al entrar a `/settings?config={...}` se muestra un banner de confirmación y el usuario puede aplicar la config de otro usuario.

---

## Sistema de temas

El `data-theme` en `<html>` activa el tema via `ThemeProvider`. Tailwind v4 consume las variables como tokens via `@theme inline`. Nunca hardcodear colores — siempre tokens semánticos.

### Distinción importante

- **Tema de UI** (`uiTheme`): controla colores de la interfaz
- **Tema del editor** (`monacoTheme`): controla los colores dentro de Monaco
- Ambos son independientes y configurables en Settings

### Temas de UI

| id                    | Label               | isDark |
| --------------------- | ------------------- | ------ |
| `light`               | Light               | false  |
| `dark`                | Dark                | true   |
| `rose-pine-dawn`      | Rosé Pine Dawn      | false  |
| `dracula`             | Dracula             | true   |
| `tlapalli-quartz`     | Tlapalli Quartz     | false  |
| `tlapalli-fire-opal`  | Tlapalli Fire Opal  | true   |

### Temas Monaco

Los mismos 6 IDs/labels con definiciones Monarch completas. Cada tema incluye reglas para keywords, strings, comments, types, functions, HTML/CSS/Markdown.

### Añadir un tema nuevo

1. Crear `src/css/themes/mi-tema.css` con tokens en `@theme inline`
2. Importarlo en `src/css/themes/index.css`
3. Añadirlo al **final** de `UI_THEMES` y `MONACO_THEMES` en `src/constants/themes.js` — ambos en el mismo orden

### Tokens CSS mínimos requeridos por tema

```css
[data-theme='nombre'] {
  @theme inline {
    --color-background, --color-surface, --color-surface-raised,
    --color-border, --color-text, --color-text-muted,
    --color-brand, --color-brand-hover,
    --color-danger, --color-warning, --color-success
  }
}
```

---

## Tipografía

| Rol           | Fuente         |
| ------------- | -------------- |
| UI (sans)     | Geist          |
| UI (mono)     | Geist Mono     |
| Editor Monaco | JetBrains Mono |

---

## Rutas

| Ruta                 | Descripción                                               |
| -------------------- | --------------------------------------------------------- |
| `/`                  | Home — lista de bins del usuario                          |
| `/new`               | Crea bin nuevo → redirige a `/editor/:binId`              |
| `/editor`            | Redirect a `/new` si no hay bin activo                    |
| `/editor/:binId`     | Editor colaborativo principal                             |
| `/embed/:binId`      | Vista embed, readonly, sin UI                             |
| `/fork/:binId`       | Animación de fork y redirect al bin nuevo                 |
| `/settings`          | Página de configuración completa                          |
| `/login`             | Importar sesión via JWT (`?token=...`)                    |
| `/user/:uuid`        | Perfil público: avatar, nombre, bins públicos             |
| `/admin`             | Redirect a `/admin/bins`                                  |
| `/admin/bins`        | Admin: todos los bins con paginación                      |
| `/admin/users`       | Admin: todos los usuarios                                 |
| `/admin/tips`        | Admin: gestión y testing de tips                          |

---

## Layout

### Desktop

```
┌──┬───────────────────────────────────────────────────────────┐
│  │ ↩ ↪ │ [tab1] [tab2] [+]  [overflow▾]   [Fork] [Share] [⋯] │
│  ├───────────────────────────────────────────────────────────┤
│S │                                                           │
│i │                    Monaco Editor                          │
│d │                                                           │
│e ├───────────────────────────────────────────────────────────┤
│b │ Markdown │ Ln 12, Col 4 │ Spaces: 2 │ ● Saved │ 👤👤 │ 💡 │
└──┴───────────────────────────────────────────────────────────┘
```

**Sidebar (izquierda)**

| Ícono | Acción    |
| ----- | --------- |
| Logo  | Home      |
| ➕    | Nuevo bin |
| ⚙️    | Settings  |

### Mobile

```
┌──────────────────────────┐
│ [tabs...] [+] [overflow] │
├──────────────────────────┤
│      Monaco Editor       │
├──────────────────────────┤
│ Lang │ Ln,Col │ 👤👤      │
├──────────────────────────┤
│  🏠  │  ➕   │    ⚙️    │  ← oculto con teclado virtual
└──────────────────────────┘
```

Safari iOS viewport: `height: 100dvh` con fallback `calc(var(--vh, 1dvh) * 100)`.

---

## Página de Settings

Página completa con scroll vertical y nav lateral, dividida en secciones:

1. **Identidad** — nombre editable, selector de color de cursor (claro/oscuro), preview en vivo
2. **Apariencia** — grid de miniaturas para tema UI y Monaco, selector de idioma
3. **Editor** — font size, tab size, word wrap, line numbers, minimap
4. **Keybindings** — tabla de shortcuts globales y Monaco, click para reasignar
5. **Prettier** — opciones globales de formato
6. **AI Completions** — proveedor, modelo, API key, botón Test
7. **Importar / Exportar** — copiar link con settings, aplicar settings, exportar sesión JWT

---

## Permisos

| Acción                | Autor | Otros                     | Admin      |
| --------------------- | ----- | ------------------------- | ---------- |
| Editar bin            | ✅    | ✅ si `is_readonly=false` | ✅ siempre |
| Cambiar `is_readonly` | ✅    | ❌                        | ✅         |
| Cambiar `visibility`  | ✅    | ❌                        | ✅         |
| Eliminar bin          | ✅    | ❌                        | ✅         |

**Admin**: usuario con `VITE_ADMIN_KEY` guardado en localStorage.

---

## Home

Estructura de arriba a abajo:

### Header

- Buscador de bins por título
- Botón "Crear nuevo bin"
- Perfil: avatar DiceBear, nombre editable, UUID copiable

### Carrusel de tips

JSON de tips con fondo de color cambiante, iconos, animación de progreso. Configurable en settings (`tipsEnabled`).

### Tus bins

Bins donde `author_id = uuid`. Vista grid o lista (`binView.myBins`). Cada card: preview de lenguajes, vistas, visibilidad, acciones.

### Compartidos contigo

Bins en `bin_collaborators` donde el usuario no es autor. Al abrir un bin por primera vez se registra automáticamente. Opción de "dejar de seguir".

### Footer

Información básica y links.

---

## Editor — Monaco

### Configuración

- Fuente: JetBrains Mono
- Tema default Monaco: `dark`
- IntelliSense completo para JS/TS/JSX/TSX, HTML, CSS, JSON
- Autocompletado por palabras para el resto

### Tabs

- Icono de lenguaje (Devicon) con color, fallback `FileIcon`
- Botón eliminar al hover (con confirmación)
- Dot cyan cuando el archivo tiene cambios no vistos
- Botones undo/redo **antes** de las tabs
- Drag & drop para reordenar
- Overflow menu cuando hay muchas tabs
- Doble click para renombrar

### Search / Replace

Widget nativo de Monaco deshabilitado. Se usa `components/system/search-widget.jsx`:

- Flotante con grip handle
- Drag con `@use-gesture/react`
- Snap a bordes (~20px threshold), animado con CSS transition
- Posición persiste en `settings.searchWidget`
- Cierra con `Escape`

### Arrastrar archivos al editor

`file-drop-overlay.jsx` — drag & drop de archivos locales al editor. El archivo se abre como nueva tab.

---

## Sincronización en tiempo real

### Canales Supabase Realtime

```
bin:{binId}:file:{fileId}    — sync de Yjs por archivo
bin:{binId}:awareness        — cursores, nombres, archivo activo
```

### Awareness payload

```js
{
  uuid, name, colorLight, colorDark,
  activeFileId,
  cursor: { lineNumber, column }
}
```

### Yjs vs Monaco

| Responsabilidad  | Quién lo maneja                           |
| ---------------- | ----------------------------------------- |
| Undo / Redo      | `Y.UndoManager` con `trackedOrigins`      |
| Contenido inicial| `Y.Doc` al montar el editor               |
| Cursores remotos | Yjs awareness → decoraciones Monaco       |

### Regla: todo cambio de contenido pasa por Yjs

```js
// ✅ Correcto — cambios programáticos (Prettier, AI, etc.)
editor.executeEdits('source-id', [{ range, text }]);

// ❌ Incorrecto — rompe la colaboración
model.setValue(newContent);
```

Excepción: la carga inicial es el único lugar donde `setValue` es aceptable.

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

### Primera clase (con runner)

`markdown`, `html`, `javascript`, `typescript`, `jsx`, `tsx`, `http`, `csv`, `json`, `yaml`, `toml`, `xml`, `svg`, `mermaid`, `strudel`, `whatsapp`

### Soporte completo (syntax highlighting)

`css`, `scss`, `python`, `rust`, `go`, `java`, `php`, `ruby`, `swift`, `kotlin`, `bash`, `sql`, `graphql`, `dockerfile`, `c`, `cpp`, `csharp`, `plaintext`

### Monarch tokenizers custom

`csv` (columnas por color), `http` (verbos, headers, separadores), `mermaid` (keywords), `whatsapp` (burbujas de chat)

### Formateo (Prettier)

`javascript`, `typescript`, `jsx`, `tsx`, `css`, `html`, `markdown`, `json`, `yaml`, `graphql`. Si un lenguaje no tiene soporte, la opción aparece deshabilitada con nota — nunca oculta.

---

## Sistema de runners

```js
// services/runners.js
{
  id: 'js',
  label: 'Console',
  icon: Terminal,
  component: JsRunner,
  languages: ['javascript', 'typescript', 'jsx', 'tsx'],
}
```

| Runner         | Label     | Lenguajes                           |
| -------------- | --------- | ----------------------------------- |
| `markdown`     | Preview   | markdown                            |
| `html`         | Preview   | html                                |
| `js`           | Console   | javascript, typescript, jsx, tsx    |
| `http`         | Requests  | http                                |
| `json`         | Preview   | json                                |
| `yaml`         | Preview   | yaml                                |
| `toml`         | Preview   | toml                                |
| `xml`          | Preview   | xml                                 |
| `svg`          | Preview   | svg                                 |
| `csv`          | Preview   | csv                                 |
| `mermaid`      | Diagram   | mermaid                             |
| `strudel`      | Live      | strudel                             |
| `whatsapp`     | Preview   | whatsapp                            |

El botón de runner en el tab bar togglea `?runner` en la URL. Desktop → `ResizablePanel`, mobile → `Drawer`. El tamaño persiste en `settings.runnerPanel.layouts` keyed por bin ID.

### Import resolver (HTML runner)

`helpers/import-resolver.js` reemplaza `./nombre.ext` con el contenido del archivo correspondiente del bin antes de ejecutar en el iframe.

---

## Runner HTTP

```http
### Obtener usuarios
GET https://myapi.com/users
Authorization: Bearer token123

### Crear usuario
POST https://myapi.com/users
Content-Type: application/json

{
  "name": "Daniel"
}
```

Múltiples requests separados por `###`. Las peticiones van via proxy (`VITE_PROXY_URL`) para resolver CORS.

Output: status code + tiempo, headers colapsables, body con syntax highlighting, historial de sesión.

---

## Paquetes npm

CDN: **`esm.sh`** — ES modules directo en el browser.

El runner inyecta los imports antes de ejecutar. Los paquetes se guardan en `bins.bins.packages` como JSONB.

### Detección automática

Monaco detecta `import ... from 'pkg'` y `require('pkg')`. Los no instalados se resaltan con decoración + lightbulb sugiriendo "Agregar al bin".

### Drawer de paquetes

`packages-drawer.jsx` — búsqueda via npm registry API, selector de versión, lista de instalados, paquetes favoritos.

---

## Fork

Al forkear se crea una copia con `forked_from` apuntando al ID del original (`on delete set null`). Hay una página `/fork/:binId` con animación de transición antes de redirigir al bin nuevo.

En el editor, badge junto al título:
- **"Fork de [nombre]"** — clickeable, navega al original
- **"Fork de bin eliminado"** — si el original fue borrado

---

## Guardado y ciclo de vida del bin

- Debounce de **1.5s** tras la última edición
- `cmd+s` / `ctrl+s` fuerza guardado inmediato
- No guarda si el contenido es solo el placeholder inicial
- Estados en status bar: `Saving...` → `Saved` → `Unsaved changes`

Al crear un bin se asigna `expires_at` a 5 minutos. En el primer guardado exitoso se actualiza a `null`. El cron job limpia expirados. `beforeunload` borra el bin si nunca se guardó (best effort, no confiable en iOS).

### Ruta `/new`

Crea bin con `expires_at = now() + 5m` y redirige. Primer archivo `README.md` con placeholder:

```markdown
**Welcome to your new bin** — start typing or paste your code here.
```

---

## Favicon y document.title

Solo activos en `/editor/:binId`.

### `document.title`

| Estado           | Título                     |
| ---------------- | -------------------------- |
| Normal           | `bin name — file name`     |
| Cambios sin foco | `✏️ bin name — file name`  |
| Nudge sin foco   | `💡 bin name — file name`  |

### Dot en tabs

Dot cyan en la tab cuando el archivo tiene cambios y no está activo. Desaparece al activar la tab.

### Favicon (`use-favicon.js`)

Canvas-based. Usa `favicon-light.png` y `favicon-dark.png` (32×32) según `isDark` del tema activo.

| Estado           | Dot     |
| ---------------- | ------- |
| Normal           | sin dot |
| Cambios sin foco | cyan    |
| Nudge sin foco   | amarillo|
| Offline          | rojo    |

---

## Command Palette y keybindings

### Command Palette

Filtra comandos por `scope` según la ruta activa. Emite eventos al BusProvider — no ejecuta lógica directamente.

**Scopes disponibles:** `*`, `['/editor']`, `['/editor', '/embed']`

**Comandos incluidos:** navegación (home, nuevo bin, nuevo archivo, settings, perfil), archivo activo (cambiar lenguaje, renombrar, eliminar, descargar, ZIP), bin (compartir, fork, eliminar, visibilidad, modo escritura), runner (abrir/cerrar), editor (word wrap, minimap, font size, indentación, formato, search), apariencia (tema UI, tema Monaco, idioma), usuario (copiar UUID, editar nombre).

### Keybindings globales

| Shortcut        | Acción                         |
| --------------- | ------------------------------ |
| `mod+shift+p`   | Command palette                |
| `mod+,`         | Settings                       |
| `alt+n`         | Nuevo bin                      |
| `alt+shift+n`   | Nuevo archivo en el bin actual |
| `mod+shift+[`   | Tab anterior                   |
| `mod+shift+]`   | Tab siguiente                  |
| `mod+shift+c`   | Copiar link del bin            |
| `alt+shift+r`   | Toggle runner                  |
| `alt+shift+f`   | Formatear código               |

`mod` = `cmd` en Mac, `ctrl` en Windows/Linux. Todos reasignables desde Settings.

### Keybindings Monaco

Monaco nativos no reimplementados: `undo`, `redo`, `opt+up/down`, `cmd+d`, `cmd+f`, `cmd+h`, `cmd+/`, `alt+click`, selección múltiple.

Monaco remapeables: `redo` (default `mod+y`).

---

## Paneles responsivos

### Runner panel

- **Desktop**: `ResizablePanel`, tamaño persiste en `settings.runnerPanel.layouts[binId]`
- **Mobile**: `Drawer`, swipe para cerrar

**Query param**: `?runner` (via `parseAsShorthandBoolean`)

```js
export const parseAsShorthandBoolean = createParser({
    parse(value) {
        if (value === null || value === '0' || value === 'false' || value === 'no') return false;
        return true;
    },
    serialize(value) { return value ? '' : null; },
}).withDefault(false);
```

### Modales

`ui/dialog.jsx` en desktop, `ui/drawer.jsx` en mobile.

---

## TanStack Query

```js
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 1000 * 60, refetchOnWindowFocus: true, retry: 2 },
    },
});
```

- Caché: bin ya cargado no se vuelve a pedir
- Optimistic updates: toggle candado, cambiar nombre, visibilidad
- Refetch automático al recuperar foco y tras offline
- Rollback automático si falla una mutation

---

## Sistema de eventos

### BusProvider (eventos locales)

Bus de eventos in-process. Sin relación con ntfy.

```js
const { emit, on } = useEvent();
emit('bin:created', { id: 'xK3mPq' });
on('bin:created', (data) => { ... });
```

### ntfy (comandos externos)

Canal pub/sub global. Todos los clientes suscriben y emiten. Filtrado por destinatario client-side.

**Formato:**
```
command:<nombre>
command:<nombre>(valor)
command:<nombre>({clave: valor})
command:<nombre>(params)|to[uuid,uuid]
```

**API (`services/commands.js`):**
- `sendCommand(name, params?)`
- `sendCommandTo(uuids, name, params?)`
- `onCommand(name, handler)`

### Easter egg — nudge 🔔

`command:nudge` → sonido MSN + shake animation en el contenedor principal + `navigator.vibrate()` en móvil.

---

## Exportar / Importar sesión

### Exportar

Settings → genera `/login?token=eyJ...`:
- JWT firmado con `{ uuid }` usando `VITE_SESSION_SECRET`
- Expiración: 15 minutos
- Se copia al clipboard con toast

### Importar (`/login?token=...`)

1. Verificar y decodificar el JWT
2. Extraer `uuid`
3. Sobreescribir el `uuid` en localStorage
4. Redirigir al home

> `VITE_SESSION_SECRET` es visible en el bundle del cliente — aceptable para uso personal/self-hosted.

---

## AI Completions

Desactivado por default. Configuración en localStorage — las keys nunca salen del dispositivo.

### Proveedores

| Proveedor          | Modelo default      |
| ------------------ | ------------------- |
| Claude (Anthropic) | `claude-sonnet-4-6` |
| OpenAI             | `gpt-4o-mini`       |
| Gemini (Google)    | `gemini-2.0-flash`  |
| OpenRouter         | configurable        |
| Ollama (local)     | configurable        |
| Custom (JSON)      | configurable        |
| Custom (JS)        | configurable        |

### Proveedor Custom JSON

```js
{
  baseUrl: string,       // URL base
  endpoint: string,      // path, ej: '/v1/completions'
  headers: object,       // headers adicionales
  bodyTemplate: object,  // body con {{prompt}} como placeholder
  responsePath: string,  // dot notation, ej: 'choices.0.message.content'
}
```

### Proveedor Custom JS

`new Function` — máxima flexibilidad. El usuario escribe una función async que recibe `(code, offset, settings)` y retorna el texto de completion.

> Ejecuta JS arbitrario — solo para uso avanzado.

El `registerCompletionItemProvider` se registra para todos los lenguajes. Si AI está desactivado, devuelve vacío sin llamar al adapter.

---

## Internacionalización

`react-i18next`. Idiomas: `en` (default), `es`. Idioma inicial inferido de `navigator.language`.

- Nunca hardcodear strings de UI
- Una instancia de `useTranslation()` por archivo de componente
- Pasar `t` como prop a sub-componentes definidos en el mismo archivo

---

## Estados especiales de UI

### Error Boundary — BSOD

Fondo azul, fuente monospace, código fake `BINS_KERNEL_PANIC_0x000000FF`, stack trace colapsable, botón "Reiniciar" (`window.location.reload()`).

### Loading — ScrambleText

`components/system/scramble-text.jsx` — caracteres que se "resuelven" progresivamente al contenido real. Para el resto: skeletons de shadcn.

### Offline

Toast de advertencia + dot rojo en favicon + indicador en status bar + sync de Yjs pausado.

### Mantenimiento

`MaintenanceProvider` con flag `MAINTENANCE_MODE` en `providers.jsx`. Muestra `maintenance-screen.jsx` si está activo.

### HeadlessGuard

`HeadlessGuard` en el árbol de providers. Detecta bots y clientes headless, redirige o bloquea según la política configurada.

### Límites

- 500 KB máximo por archivo
- 10 archivos máximo por bin
- Toast de aviso al alcanzar el límite

### Tips

**Home**: `tips-carousel.jsx` — carrusel con fondo de color cambiante, iconos, barra de progreso.

**Editor**: icono 💡 en el status bar — click muestra un tip aleatorio. Aparece automáticamente en cada refresh. Desactivable en Settings (`tipsEnabled`).

**Admin**: `/admin/tips` — tabla de gestión y preview de todos los tips.

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ADMIN_KEY=           # habilita modo admin
VITE_PROXY_URL=           # ej: https://endpoints.hckr.mx/proxys/custom
VITE_SESSION_SECRET=      # clave para firmar JWTs de transferencia de sesión
```

### Vercel

```json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
