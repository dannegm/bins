# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Bins** — real-time collaborative code editor and playground (like Pastebin meets VS Code). Hosted at `bins.hckr.mx`, deployed on Vercel. Desktop-first, with mobile support.

**`PLAN.md` is the primary reference and instruction source for this project.** Read it before starting any task — it contains the full specification, database schema, component structure, feature breakdown, development phases, and all rules not listed here.

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

- **JavaScript only** — no TypeScript, no `.ts`/`.tsx` files, no JSDoc, no type annotations
- `export const` for everything; `export default` only in `app.jsx`
- `useRef` variables use `$` prefix, no `Ref` suffix (e.g., `$editor`, `$container`)
- `async/await` over `.then()/.catch()`
- **All files and folders in `kebab-case`** — no exceptions
- Component files: `kebab-case.jsx`; utility files: `kebab-case.js`
- Components: PascalCase; hooks: camelCase with `use` prefix
- No obvious comments — code must be self-explanatory

## CSS and Tailwind

- **`cn()` always** — import from `@/helpers/utils.js`. Pass variables directly and use objects for conditional classes. Never build class strings via template literals or string concatenation (`` `col-span-${n}` ``, `'base ' + cls`, etc.) — Tailwind can't scan dynamic strings and the classes get purged.
- **Text opacity minimums** — main labels `text-white/90`+, secondary `text-white/70`+, hints `text-white/50`+. Below `/50` only for decorative or disabled elements.
- **No opacity on icons or text** — never use opacity suffixes (e.g. `text-white/25`) on icons or text. Stroke-based icons have overlapping paths at junctions — transparency causes a visible superposition artifact. Use solid palette colors instead (e.g. `text-zinc-500`).
- **Icon sizing** — use `[&>svg]:size-X` on the container, never the `size` prop on Lucide icons.
- **Square sizing** — when `w-X` and `h-X` are the same value, use `size-X` (e.g. `w-4 h-4` → `size-4`). Exception: conditional orientation classes like `data-horizontal:w-full data-vertical:h-full`.
- **Units** — prefer `rem` over `px` in inline styles, CSS custom properties, and raw CSS. Use `px` only for values that must not scale (e.g. 1px borders).
- **Tailwind scale** — always use built-in scale values over arbitrary brackets. `1 unit = 0.25rem = 4px`. Only use `size-[X]` when no equivalent exists on the scale.
- **Dynamic values** — pass runtime values as CSS custom properties via `style` and reference with Tailwind's variable syntax: `<div className="w-(--panel-width)" style={{ '--panel-width': '22.5rem' }} />`. Use kebab-case for the variable name.
- **Shadows** — always pair a shadow size with an explicit color: `shadow-lg shadow-black/30`. Tailwind v4 shadows have no default color and will be invisible without one.

## UI Implementation Rules

These rules were established through iteration and must be followed without exception:

### i18n

- **No hardcoded UI strings** — every label, placeholder, title, and message goes through `useTranslation`.
- **One hook instance per file** — call `useTranslation()` once at the top-level component and pass `t` as a prop to helper/sub-components in the same file. Never call `useTranslation()` inside sub-components defined in the same file.

### Theme colors

- **No explicit color classes** — never use `text-indigo-400`, `bg-white/5`, `border-zinc-800`, etc. Always use semantic tokens (`text-brand`, `bg-surface`, `border-border`).
- **Missing token? Create it** — if no token exists for a need, register the CSS variable in all 3 theme files (`dark.css`, `light.css`, `dracula.css`) and add it to `@theme inline` in `index.css`, then use it.
- **Component-specific colors** — when a component needs its own colors that don't belong to the theme (e.g. dynamic accent colors), define `--var-dark` and `--var-light` CSS custom properties and switch with the `dark:` custom variant: `bg-(--var-light) dark:bg-(--var-dark)`.

### Dynamic values (CSS custom property pattern)

- **Never `style={{ color: value }}`** — always pass runtime values as CSS custom properties and reference them with Tailwind's variable syntax:
    ```jsx
    <div className='bg-(--item-color)' style={{ '--item-color': color }} />
    ```
- This applies to any dynamic value: colors, sizes, offsets — anything that varies at runtime.

### Conditional classes

- **Objects, not ternaries** — always use conditional objects inside `cn()`:
    ```jsx
    // Correct
    cn('base', { extra: isActive, other: isDisabled });
    // Wrong
    cn(isActive ? 'extra' : 'other');
    ```

### Components and composition

- **Use shadcn/ui components first** — before writing any custom UI, check `src/ui/` and the shadcn registry. Ask before implementing something custom.
- **Don't recreate existing components** — reuse what's already in the project.
- **Compose, don't conditionally render inline** — extract conditional states (loading, empty, error) into their own named components and return them early, rather than embedding `{isLoading && <...>}` inside JSX.

### Navigation buttons

- **`render` + `nativeButton={false}`** — when a Base UI `Button` should navigate, use `render={<Link to='...' />}` and always add `nativeButton={false}` to suppress the native button warning:
    ```jsx
    <Button render={<Link to='/new' />} nativeButton={false}>
        New bin
    </Button>
    ```

### Responsive design

- **Every component needs mobile + desktop** — default styles are mobile-first; use `sm:` (and `lg:`, `xl:`) for desktop. Consider both layouts for every new component. Use `short:` for viewport height constraints (<600px).

## Stack

| Layer              | Tool                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vite + React                                                                                                                |
| Styles             | Tailwind CSS v4                                                                                                             |
| UI primitives      | shadcn/ui with **Base UI** (`@base-ui/react`) — not Radix. Use Radix only as documented fallback when Base UI lacks support |
| Routing            | TanStack Router (file-based, Vite plugin)                                                                                   |
| Server state       | TanStack Query                                                                                                              |
| URL state          | nuqs                                                                                                                        |
| Real-time sync     | Yjs (CRDT) + Supabase Realtime (Broadcast)                                                                                  |
| Database           | Supabase (PostgreSQL, schema `bins`)                                                                                        |
| Editor             | Monaco Editor (`vite-plugin-monaco-editor`)                                                                                 |
| Hotkeys            | `useHotkeys`                                                                                                                |
| Command palette    | `cmdk` (shadcn)                                                                                                             |
| Code transpilation | sucrase (in-browser REPL)                                                                                                   |
| Pub/sub            | `ntfy` (abstraction provided by author)                                                                                     |
| Avatars            | DiceBear `rings` style, seeded from UUID                                                                                    |
| Language icons     | Devicon (SVG/font)                                                                                                          |
| i18n               | `react-i18next` (locales: `en`, `es`)                                                                                       |
| AI completions     | Claude / OpenAI / Gemini / OpenRouter / Ollama (user-configurable)                                                          |
| Auth               | None — anonymous identity via UUID in localStorage                                                                          |

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
VITE_PROXY_URL=        # For HTTP runner
```

## Documentation Files to Keep in Sync

After every significant change, update the relevant file(s):

- `CLAUDE.md` — this file (current state, decisions, known issues)
- `AGENTS.md` — neutral copy for other AI tools
- `docs/architecture.md`, `docs/database.md`, `docs/sync.md`, `docs/runners.md`, `docs/keybindings.md`, `docs/components.md`, `docs/settings.md`, `docs/theming.md`, `docs/deployment.md`, `docs/changelog.md`
