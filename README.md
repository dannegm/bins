# Bins

Real-time collaborative code editor and playground. Think Pastebin meets VS Code — share a link, start editing together, no account required.

**Live at [bins.hckr.mx](https://bins.hckr.mx)**

---

## Features

- **Real-time collaboration** — multiple users editing the same file simultaneously via Yjs CRDTs over Supabase Realtime
- **Multi-file bins** — up to 10 files per bin, each with its own language and tab
- **Monaco editor** — the same engine that powers VS Code, with syntax highlighting for 28 languages
- **Anonymous identity** — no sign-up. You get a UUID, a generated avatar, and a display name. That's your identity everywhere
- **Read-only / editable modes** — toggle per-bin visibility with a single click
- **Fork** — copy any bin to your own account with one click
- **AI completions** — inline suggestions via Claude, OpenAI, Gemini, OpenRouter, Ollama, or any custom OpenAI-compatible endpoint
- **Command palette** — `⌘K` to do anything
- **Customizable keybindings** — remap every shortcut from settings
- **Prettier formatting** — configurable per user, applied on demand
- **Embed** — read-only iframe embed for any bin via `/embed/:id`
- **Themes** — Dark, Light, Dracula, Rosé Pine Dawn (UI + Monaco themes linked)
- **i18n** — English and Spanish

---

## Stack

| Layer           | Tool                                      |
| --------------- | ----------------------------------------- |
| Framework       | Vite + React 19                           |
| Styles          | Tailwind CSS v4                           |
| UI primitives   | shadcn/ui with Base UI (`@base-ui/react`) |
| Routing         | TanStack Router (file-based)              |
| Server state    | TanStack Query                            |
| URL state       | nuqs                                      |
| Real-time sync  | Yjs (CRDT) + Supabase Realtime Broadcast  |
| Database        | Supabase (PostgreSQL)                     |
| Editor          | Monaco Editor                             |
| Animations      | Motion (Framer Motion v12)                |
| Hotkeys         | react-hotkeys-hook                        |
| Command palette | cmdk                                      |
| Avatars         | DiceBear `rings` style, seeded from UUID  |
| Language icons  | Devicon                                   |
| i18n            | react-i18next                             |
| Deploy          | Vercel                                    |

---

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Production build
pnpm build
```

### Environment variables

Create a `.env.local` at the root:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PROXY_URL=      # Optional — required for the HTTP runner
VITE_ADMIN_CLAIM_URL=     # Optional — endpoint to verify admin password server-side (default: https://endpoints.hckr.mx/bins/admin/claim)
```

---

## Architecture

### Identity

No authentication. On first visit, a UUID is generated and stored in `localStorage`. This UUID is sent as the `x-client-id` header on every Supabase request. RLS policies use `current_setting('request.headers')::json->>'x-client-id'` to scope writes — you can only modify your own bins.

### Real-time sync

Each file (`bin_file`) has a `ydoc_state` bytea column. Yjs manages CRDT merging client-side. Supabase Realtime Broadcast channels transport Yjs update messages between clients. Cursor positions and collaborator awareness run over the same channel.

### Data model

```
profiles       — uuid, name, color_light, color_dark
bins           — id, title, author_id, is_readonly, expires_at, views
bin_files      — id, bin_id, name, language, content, ydoc_state, position
bin_collaborators — bin_id, user_id
```

Limits: 500 KB max per file, 10 files max per bin (enforced at the DB level).

### Supported languages

Markdown, JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, JSON, YAML, TOML, Python, Rust, Go, Java, PHP, Ruby, Swift, Kotlin, Bash, SQL, GraphQL, Dockerfile, XML, C, C++, C#, Plain text

---

## Project structure

```
src/
├── components/       # Feature components (editor, bins, admin, settings, system)
├── constants/        # Languages, themes, default settings, keybindings
├── css/              # Tailwind entry + theme CSS files (dark, light, dracula, rose-pine-dawn)
├── helpers/          # Utility functions (cn, arrays, objects, parsers, strings, avatar)
├── hooks/            # Custom React hooks
├── locales/          # i18n JSON files (en, es)
├── pages/            # Page-level components
├── providers/        # React context providers (identity, settings, theme, bus, query)
├── routes/           # TanStack Router file-based routes
├── services/         # Supabase service layer (bins, files, profiles, collaborators)
└── ui/               # shadcn/ui component library
```

---

## License

MIT — see [LICENSE](LICENSE)
