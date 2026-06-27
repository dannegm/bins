---
name: gen-tips
description: >
  Generate tips for the Bins tips carousel. With no args: audits the codebase for uncovered
  features and lets the user pick which to add via checkboxes. With args: takes a rough
  description and creates a tip directly from it, inferring all fields.
  Invoke as: /gen-tips  or  /gen-tips <free-text description of the tip>
---

# /gen-tips

Two modes depending on whether arguments were passed.

---

## MODE A — Explicit tip (args provided)

If the user passed any text after `/gen-tips`, use that as the raw description of a tip to create.

### Steps

1. Read `src/constants/tips.js` to check the tip doesn't already exist (same concept).
2. Infer all fields from the description — rewrite the copy for clarity and brevity:
   - `id` — kebab-case slug, descriptive
   - `icon` — most semantically fitting Lucide icon name
   - `title` — ~3 words, EN and ES
   - `body` — one punchy sentence ~12–18 words, EN and ES. Use tags where they add clarity (see tag reference below).
3. Show the proposed tip to the user (formatted) and ask **"¿Lo añado?"**
4. On confirmation, implement it (see Implementation section).

---

## MODE B — Audit mode (no args)

If no arguments were passed, audit the codebase for feature gaps.

### Step 1 — Read current state

Read these files:

- `src/constants/tips.js` — existing tip IDs
- `src/locales/en.json` — `editor.tips` block
- `PLAN.md` — full feature spec
- `src/routes/` — implemented routes
- `src/services/runners.js` — registered runners
- `src/constants/default-settings.js` — settings and keybindings
- `src/components/editor/` — editor features

### Step 2 — Evaluate ALL candidate features

Evaluate every non-trivial implemented feature not already in `src/constants/tips.js`. For each candidate, decide:

- **Include** — non-obvious, actionable, genuinely useful to discover
- **Skip** — too obvious, too niche, or already partially covered

Do NOT skip features just because they seem minor — the user makes the final call.

If there are **zero candidates at all** (every feature is already covered or trivially obvious), output:

> **Todo cubierto.** Los tips actuales cubren todas las funcionalidades relevantes del proyecto. No hay nada que añadir por ahora.

Then stop.

### Step 3 — Present candidates with checkboxes

Use `AskUserQuestion` with `multiSelect: true`. List **all evaluated candidates** as options — both recommended and skipped — so the user can override either direction.

Label format:
- Recommended: `Feature name — one-line description`
- Suggested skip: `[skip] Feature name — reason it was deprioritized`

The user checks what they want included. Unchecked items are discarded.

### Step 4 — Draft and confirm

For each selected candidate, draft the full tip (id, icon, EN/ES title+body) and show it. Ask **"¿Los añado?"** — one confirmation for the whole batch.

On confirmation, implement all of them.

---

## Implementation

For each confirmed tip:

1. Append to `src/constants/tips.js`: `{ id: '...', icon: '...' }`
2. Append to `src/locales/en.json` under `editor.tips`: `"<id>": { "title": "...", "body": "..." }`
3. Append to `src/locales/es.json` under `editor.tips`: `"<id>": { "title": "...", "body": "..." }`

Do **not** modify `tips-carousel.jsx`, `status-bar.jsx`, or any other component — tips are purely data.

---

## Tag reference

| Tag | Renders as |
|-----|------------|
| `{{icon:name}}` | Inline Lucide icon (e.g. `{{icon:plus}}`) |
| `{{shortcut:key_name}}` | Platform-aware keyboard shortcut from user keybindings |
| `{{kbd:key}}` | Literal key label (e.g. `{{kbd:Esc}}`) — use only when no shortcut binding exists |
| `{{color:#hex}}` | Colored dot swatch |
| `{{lang:id}}` | Language icon/dot (e.g. `{{lang:js}}`) |
| `{{link:text\|url}}` | Inline hyperlink |
| `**bold**` | Bold text |
| `*italic*` | Italic text |

Prefer `{{shortcut:...}}` over `{{kbd:...}}` for any action that has a keybinding (`appKeybindings` in `default-settings.js`). Only use `{{kbd:...}}` for keys without a binding (e.g. `Esc`, `Tab`, `Enter`).

Keep body copy tight — one sentence. Use tags where they add clarity, not decoratively.
