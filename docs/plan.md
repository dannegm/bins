# Bins — Plan de Proyecto

**Dominio:** `bins.hckr.mx` — **Deploy:** Vercel — **Plataformas:** Desktop y mobile (prioridad desktop)

---

## Índice

1. [Convenciones de código](#convenciones-de-código)
2. [Stack tecnológico](#stack-tecnológico)
3. [Base de datos](#base-de-datos-supabase)
4. [Schema de settings](#schema-de-settings)
5. [Sistema de temas](#sistema-de-temas)
6. [Rutas](#rutas)
7. [Permisos](#permisos)
8. [Yjs — reglas críticas](#yjs--reglas-críticas)
9. [Sync — canales Realtime](#sync--canales-realtime)
10. [Lenguajes custom (pendiente)](#lenguajes-custom-pendiente)
11. [Sistema de runners](#sistema-de-runners)
12. [Paquetes npm (pendiente)](#paquetes-npm-pendiente)
13. [Keybindings](#keybindings)
14. [Sistema de comandos (ntfy)](#sistema-de-comandos-ntfy)
15. [AI Completions](#ai-completions)
16. [Variables de entorno](#variables-de-entorno)
17. [Tareas pendientes](#tareas-pendientes)
18. [Fases de desarrollo](#fases-de-desarrollo)

---

## Convenciones de código

- **Solo JavaScript** — sin TypeScript, sin JSDoc, sin anotaciones de tipo
- `export const` para todo; `export default` solo en `app.jsx`
- Variables `useRef` con prefijo `$` y sin sufijo `Ref` (ej: `$editor`, `$container`)
- `async/await` sobre `.then()/.catch()`
- Componentes en PascalCase, hooks en camelCase con prefijo `use`
- Archivos y carpetas en `kebab-case` sin excepción
- Sin comentarios obvios — el código debe ser autoexplicativo

---

## Stack tecnológico

| Capa                | Herramienta                                                        |
| ------------------- | ------------------------------------------------------------------ |
| Framework           | Vite + React                                                       |
| Estilos             | Tailwind CSS v4                                                    |
| Componentes         | shadcn/ui con **Base UI** (`@base-ui-components/react`) — no Radix |
| Editor              | Monaco Editor (`vite-plugin-monaco-editor`)                        |
| CRDT / Sync         | Yjs + Supabase Realtime (Broadcast)                                |
| Base de datos       | Supabase (PostgreSQL, schema `bins`)                               |
| Server state        | TanStack Query                                                     |
| Estado URL          | nuqs                                                               |
| Routing             | TanStack Router (file-based)                                       |
| Hotkeys             | `useHotkeys`                                                       |
| Command palette     | `cmdk` (shadcn)                                                    |
| Drag / gestos       | `@use-gesture/react`                                               |
| Paneles             | `react-resizable-panels` (shadcn Resizable)                        |
| TS/JSX transpile    | sucrase (browser REPL)                                             |
| Formatter           | Prettier                                                           |
| Validación          | Zod                                                                |
| IDs cortos          | nanoid                                                             |
| ZIP                 | fflate                                                             |
| Avatares            | DiceBear `rings`, seed = UUID                                      |
| Iconos de lenguajes | Devicon                                                            |
| i18n                | `react-i18next` (en, es)                                           |
| JWT                 | `jose`                                                             |
| Pub/sub             | ntfy                                                               |
| AI Completions      | Claude / OpenAI / Gemini / OpenRouter / Ollama                     |

---

## Base de datos (Supabase)

> Schema completo en **`db.sql`**. Migraciones incrementales en `migrations/`.

| Tabla                    | Descripción                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `bins.profiles`          | Perfiles anónimos — UUID, nombre, colores, fingerprint, flags |
| `bins.bins`              | Bins — título, autor, visibilidad, expiración, paquetes npm   |
| `bins.bin_files`         | Archivos — contenido texto + `ydoc_state` bytea para Yjs      |
| `bins.bin_collaborators` | Registro de quién ha abierto cada bin                         |

Límites: 500 KB por archivo, 10 archivos por bin (enforced via constraint + trigger).

El cliente Supabase envía el UUID del usuario en `x-client-id`. RLS usa `current_setting('request.headers')::json->>'x-client-id'` para identificar al caller.

**Notas clave:**

- `is_readonly = true` por default — solo el autor puede editar
- El admin (`is_admin = true` en DB) se activa via command palette (`$%&:<password>`) → `VITE_ADMIN_CLAIM_URL`
- `bins.profiles` se puebla via upsert silencioso al arrancar la app; el `uuid` **nunca cambia**
- El fingerprint (`ip_hash`, `country`, `city`, `user_agent`, `is_bot`) se registra **solo en el primer visit**

---

## Schema de settings

```js
{
  uuid, name, colorLight, colorDark,        // identidad
  language, uiTheme, monacoTheme,           // apariencia
  fontSize, tabSize, wordWrap, lineNumbers, minimap,  // editor
  searchWidget: { x, y },
  runnerPanel: { size },                    // % ancho
  tipsEnabled: true,
  aiCompletions: { enabled, provider, apiKey, baseUrl, model },
  keybindings: { redo: 'cmd+y' },
  prettier: { printWidth, singleQuote, semi, trailingComma, tabWidth, bracketSpacing, endOfLine, overrides }
}
```

Settings compartibles via URL: `/settings?config=...` — banner de confirmación al cargar.

---

## Sistema de temas

`data-theme` en `<html>` → CSS custom properties → Tailwind v4 `@theme`. **Nunca hardcodear colores**, siempre tokens semánticos (`text-brand`, `bg-surface`, etc.).

**Temas:** `dark`, `light`, `dracula`, `rose-pine-dawn`, `tlapalli-quartz`, `tlapalli-fire-opal`

**Cómo agregar un tema:**

1. Crear `src/css/themes/<id>.css` con los tokens en `@theme`
2. Importar en `src/css/themes/index.css`
3. Registrar en `src/constants/themes.js` como `{ id, label, isDark }` — **siempre al final** de ambos arrays `UI_THEMES` y `MONACO_THEMES`, en el mismo orden

---

## Rutas

| Ruta              | Descripción                            |
| ----------------- | -------------------------------------- |
| `/`               | Home                                   |
| `/new`            | Crea bin nuevo → redirige al editor    |
| `/editor/:bin-id` | Editor colaborativo                    |
| `/embed/:bin-id`  | Vista embed, readonly                  |
| `/settings`       | Configuración completa                 |
| `/login`          | Importar sesión via JWT (`?token=...`) |
| `/user/:uuid`     | Perfil público                         |
| `/admin/bins`     | Admin: todos los bins                  |
| `/admin/users`    | Admin: todos los usuarios              |
| `/fork/:bin-id`   | Animación de fork                      |

---

## Permisos

| Acción                | Autor | Otros                     | Admin      |
| --------------------- | ----- | ------------------------- | ---------- |
| Editar bin            | ✅    | ✅ si `is_readonly=false` | ✅ siempre |
| Cambiar `is_readonly` | ✅    | ❌                        | ✅         |
| Cambiar `visibility`  | ✅    | ❌                        | ✅         |
| Eliminar bin          | ✅    | ❌                        | ✅         |

---

## Yjs — reglas críticas

**Prohibido después de la inicialización:**

- `model.setValue()` — rompe el CRDT
- Manipulación directa del DOM del editor

**Obligatorio para cambios programáticos** (Prettier, AI, etc.):

```js
editor.executeEdits('source-id', [{ range, text }]); // ✅
model.setValue(newContent); // ❌
```

**Loop prevention:**

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

Undo/Redo via `Y.UndoManager` con `trackedOrigins: new Set([clientUUID])` — no el undo nativo de Monaco.

---

## Sync — canales Realtime

```
bin:{binId}:file:{fileId}   — sync Yjs por archivo
bin:{binId}:awareness       — cursores, nombres, archivo activo
```

Awareness payload: `{ uuid, name, colorLight, colorDark, activeFileId, cursor: { lineNumber, column } }`

El color del cursor usa `colorDark` o `colorLight` según `isDark` del tema activo.

---

## Lenguajes custom (pendiente)

Implementar con Monarch tokenizer en `src/helpers/monaco-languages.js`:

| Lenguaje  | Extensión     | Descripción                                  |
| --------- | ------------- | -------------------------------------------- |
| Arduino   | `.ino`        | Subset de C++ con keywords de Arduino        |
| Minecraft | `.mcfunction` | Comandos de Minecraft                        |
| `.env`    | `.env`        | Claves y valores con color                   |
| Logs      | `.log`        | Niveles por color (ERROR, WARN, INFO, DEBUG) |

Registrar en `src/constants/languages.js` con `{ id, label, extensions, runner, icon }`.

---

## Sistema de runners

Registro en `src/services/runners.js`:

```js
{
  id: 'javascript',
  label: 'Run',
  icon: PlayIcon,
  component: JsReplRunner,
  languages: ['javascript', 'typescript', 'jsx', 'tsx'],
}
```

El botón togglea `?runner` en la URL. Desktop → `ResizablePanel`, mobile → `Drawer`.

Runners implementados: `markdown`, `html`, `js/ts/jsx/tsx`, `regex`, `http`, `csv`, `json`, `svg`, `mermaid`, `whatsapp`.

---

## Paquetes npm ✅

CDN: **`esm.sh`** — ES modules en browser. Los paquetes se guardan en `bins.bins.packages` como JSONB.

### Drawer (`components/editor/packages-drawer.jsx`)

- Botón `Package` en sidebar — visible solo cuando el archivo activo es JS/TS/JSX/TSX
- Búsqueda debounced via npm registry API (`registry.npmjs.org/-/v1/search`)
- Lista de instalados con opción de eliminar y marcar favorito
- Favoritos guardados en `settings.favoritePackages` (solo nombre, sin versión)
- Estrella filled amarilla (`--favorite`) con hover→StarOff para quitar

### JS Runner

- Cuando hay paquetes: inyecta `<script type="importmap">` + ejecuta como `type="module"`
- Los `import` se extraen al nivel del módulo (fuera del try/catch)
- Sin paquetes: comportamiento original (script clásico, sin importmap)

---

## Keybindings

### Globales (`useHotkeys`)

| Shortcut            | Acción                              |
| ------------------- | ----------------------------------- |
| `cmd+k`             | Command palette                     |
| `cmd+,`             | Settings                            |
| `cmd+n`             | Nuevo bin                           |
| `cmd+shift+n`       | Nuevo archivo                       |
| `cmd+shift+[` / `]` | Tab anterior / siguiente            |
| `cmd+shift+c`       | Copiar link del bin                 |
| `opt+shift+r`       | Toggle runner                       |
| `opt+shift+f`       | Formatear código                    |
| `opt+shift+w`       | Toggle word wrap                    |
| `cmd+w`             | Interceptado — evita cerrar pestaña |

### Monaco (nativos — no reimplementar)

`undo`, `redo`, `opt+up/down`, `cmd+d`, `cmd+f`, `cmd+h`, `cmd+/`, `alt+click`, selección múltiple

---

## Sistema de comandos (ntfy)

Formato del mensaje ntfy:

```
command:<nombre>
command:<nombre>(valor)
command:<nombre>({clave: valor})
command:<nombre>(params)|to[uuid,uuid]
```

API en `services/commands.js`:

- `sendCommand(name, params?)`
- `sendCommandTo(uuids, name, params?)`
- `onCommand(name, handler)`

---

## AI Completions

| Proveedor   | Modelo default                             |
| ----------- | ------------------------------------------ |
| Claude      | `claude-sonnet-4-6`                        |
| OpenAI      | `gpt-4o-mini`                              |
| Gemini      | `gemini-2.0-flash`                         |
| OpenRouter  | configurable                               |
| Ollama      | configurable                               |
| Custom JSON | schema Zod en `ai-completions-section.jsx` |
| Custom JS   | `new Function` — ejecuta código arbitrario |

Todos los settings de AI viven en localStorage — las keys nunca salen del dispositivo.

---

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PROXY_URL=              # https://endpoints.hckr.mx/proxys/custom
VITE_SESSION_SECRET=         # firma JWTs de transferencia de sesión
VITE_ADMIN_CLAIM_URL=        # default: https://endpoints.hckr.mx/bins/admin/claim
```

---

## Tareas pendientes

### Vercel

- [ ] Crear proyecto conectado al repo
- [ ] Configurar variables de entorno
- [ ] Crear `vercel.json` con rewrites
- [ ] Configurar dominio `bins.hckr.mx`

---

## Fases de desarrollo

### Fase 3 — Polish (pendiente)

- [ ] Lenguajes custom (Arduino, Minecraft, `.env`, logs)
- [x] Paquetes npm (esm.sh) — `components/editor/packages-drawer.jsx`
- [ ] Search widget flotante con drag+snap — `components/system/search-widget.jsx`
- [ ] Tips en el editor — icono 💡 en status bar → tip aleatorio flotante (`constants/tips.js` existe)
- [ ] Modo presentación (fullscreen)

### Fase 4 — Futuras

- [ ] Comentarios inline por línea
- [ ] Diff view entre archivos o bins
- [ ] Detección automática de lenguaje
- [ ] Más temas UI
