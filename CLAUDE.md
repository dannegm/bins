# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Bins** — real-time collaborative code editor and playground (like Pastebin meets VS Code). Hosted at `bins.hckr.mx`, deployed on Vercel. Desktop-first, with mobile support. See `PLAN.md` for the full specification.

## Development Commands

```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

> `package.json` has not been scaffolded yet. These commands will be available once the initial setup is done.

## Development Process

- **One feature at a time** — implement, pause, wait for manual testing by the author, then continue
- **No automated tests** — all testing is manual
- After each unit of work, summarize: what was implemented, what to test, what's next
- **Wait for explicit confirmation** before continuing to the next step
- Keep `CLAUDE.md`, `AGENTS.md`, and all `/docs/*.md` files in sync after every significant change

## Code Conventions

- **JavaScript only** — no TypeScript, no `.ts`/`.tsx` files
- `export const` for all exported functions and variables
- `useRef` variables use `$` prefix, no `Ref` suffix (e.g., `$editor`, `$container`)
- `async/await` over `.then()/.catch()`
- **All files and folders in `kebab-case`** — no exceptions
- Component files: `kebab-case.jsx`; utility files: `kebab-case.js`
- Components: PascalCase; hooks: camelCase with `use` prefix
- No obvious comments — code must be self-explanatory

## Stack

| Layer | Tool |
|---|---|
| Framework | Vite + React |
| Styles | Tailwind CSS v4 |
| UI primitives | shadcn/ui with **Base UI** (`@base-ui-components/react`) — not Radix. Use Radix only as documented fallback when Base UI lacks support |
| Routing | TanStack Router (file-based, Vite plugin) |
| Server state | TanStack Query |
| URL state | nuqs |
| Real-time sync | Yjs (CRDT) + Supabase Realtime (Broadcast) |
| Database | Supabase (PostgreSQL, schema `bins`) |
| Editor | Monaco Editor (`vite-plugin-monaco-editor`) |
| Hotkeys | `useHotkeys` |
| Command palette | `cmdk` (shadcn) |
| Code transpilation | sucrase (in-browser REPL) |
| Pub/sub | `ntfy` (abstraction provided by author) |
| Avatars | DiceBear `rings` style, seeded from UUID |
| Language icons | Devicon (SVG/font) |
| i18n | `react-i18next` (locales: `en`, `es`) |
| AI completions | Claude / OpenAI / Gemini / OpenRouter / Ollama (user-configurable) |
| Auth | None — anonymous identity via UUID in localStorage |

## Architecture

### Identity

No authentication. Each user gets a UUID generated on first visit (stored in `localStorage`). This UUID is sent as `x-client-id` header on every Supabase request. RLS policies use `current_setting('request.headers')::json->>'x-client-id'` to scope writes.

### Real-time Sync

Each `bin_file` has a `ydoc_state` (bytea) column. Yjs manages CRDT merging; Supabase Realtime Broadcast channels transport Yjs update messages between clients. Awareness (cursor positions, collaborator info) runs over the same channel.

### Runners

Pluggable per-language execution panels mounted beside the editor. Registered in `src/services/runners.js`. Supported: Markdown (preview), HTML (sandboxed iframe), JS/TS/JSX/TSX (sucrase REPL), Regex (railroad diagrams via regexper), HTTP (proxy-based REST client).

### Providers tree (`src/providers/providers.jsx`)

Global provider order (outermost → innermost): QueryProvider → BusProvider → IdentityProvider → SettingsProvider → ThemeProvider → app content.

### Routing (`src/routes/`)

TanStack Router file-based routes:
- `__root.jsx` — global layout, mounts providers
- `index.jsx` — home (bin list)
- `editor.$bin-id.jsx` — main collaborative editor
- `embed.$bin-id.jsx` — readonly embed view
- `settings.jsx` — full settings page
- `user.$uuid.jsx` — public user profile
- `admin.bins.jsx` / `admin.users.jsx` — admin panels

### Database (Supabase schema `bins`)

Tables: `profiles`, `bins`, `bin_files`, `bin_collaborators`. Limits enforced via DB constraints: 500 KB max per file, 10 files max per bin. RLS enabled on all tables. Full schema in `PLAN.md` and `docs/database.md`.

### Theme System

CSS custom properties set via `data-theme` on `<html>`. Tailwind v4 tokens consume those variables. Themes defined in `src/css/themes/` and registered in `src/constants/themes.js`.

### Settings

Persisted in `localStorage` via `src/services/settings.js`. Some settings shared via URL params (nuqs). Schema in `src/constants/default-settings.js`.

## Author-provided Modules

These will be handed off before implementation — do not stub or recreate:
- `ntfy.js` — pub/sub abstraction
- `BusProvider` — internal event bus
- `Icons` component — custom SVG icons
- `objects.js` — dot-notation resolver
- `parsers.js` — nuqs parsers including `parseAsShorthandBoolean`

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_HTTP_PROXY_URL=        # For HTTP runner
```

## Documentation Files to Keep in Sync

After every significant change, update the relevant file(s):
- `CLAUDE.md` — this file (current state, decisions, known issues)
- `AGENTS.md` — neutral copy for other AI tools
- `docs/architecture.md`, `docs/database.md`, `docs/sync.md`, `docs/runners.md`, `docs/keybindings.md`, `docs/components.md`, `docs/settings.md`, `docs/theming.md`, `docs/deployment.md`, `docs/changelog.md`
