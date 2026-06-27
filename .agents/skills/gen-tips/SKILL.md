---
name: gen-tips
description: >
  Analyze the Bins codebase and suggest new tips for features not yet covered by existing tips.
  Only proposes tips for real, implemented features that are genuinely useful to discover.
  Never invents unnecessary tips — if all features are covered, says so explicitly.
  Invoke as: /gen-tips
---

# /gen-tips

Audit the project for features not yet represented in the tips carousel, then propose additions — or declare full coverage.

## Step 1 — Read current state

Read these files to understand what already exists:

- `src/constants/tips.js` — existing tip IDs (the source of truth for what's covered)
- `src/locales/en.json` — the `editor.tips` block, to see existing tip content
- `PLAN.md` — full feature spec for the project
- `src/routes/` — implemented routes (signals which features are real and shipped)
- `src/services/runners.js` — registered runners (each runner may deserve a tip)
- `src/constants/default-settings.js` — settings that users may not discover on their own
- `src/components/editor/` — editor features (keybindings, panels, overlays, etc.)

## Step 2 — Gap analysis

Compare implemented features against existing tip IDs. A feature warrants a new tip **only if**:

- It is genuinely implemented (not planned/stubbed)
- It is non-obvious — a user could easily miss it
- It is actionable — the tip tells the user something they can actually do
- It is not already covered by an existing tip, even partially

**Do NOT propose tips for:**
- Features already in `src/constants/tips.js` (even if under a slightly different angle)
- Trivial or obvious UI elements (e.g. "you can type in the editor")
- Planned but unimplemented features
- Meta-tips about tips themselves

If you find **zero gaps**, output exactly:

> **Todo cubierto.** Los tips actuales cubren todas las funcionalidades relevantes del proyecto. No hay nada que añadir por ahora.

Stop there. Do not proceed.

## Step 3 — Propose tips (only if gaps exist)

For each genuine gap, propose a tip in this format:

```
### <id>  (kebab-case, unique, descriptive)
- **icon**: <lucide icon name>  (pick the most semantically fitting one)
- **EN title**: <short title, ~3 words>
- **EN body**: <one sentence, ~12–18 words>
- **ES title**: <Spanish translation>
- **ES body**: <Spanish translation>
- **Tags used**: list any inline tags from the available set (see below)
```

Keep body copy tight. One punchy sentence. Use tags where they add clarity — not decoratively.

### Available inline tags for body/title

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

Prefer `{{shortcut:...}}` over `{{kbd:...}}` for any action that has a keybinding. Only use `{{kbd:...}}` for keys with no binding (like `Esc`, `Tab`, `Enter`).

## Step 4 — Ask for confirmation

After listing proposals, ask: **"¿Implemento estos tips?"**

Do not implement anything until the user confirms.

## Step 5 — Implement (on confirmation)

For each confirmed tip:

1. Add entry to `src/constants/tips.js`: `{ id: '...', icon: '...' }`
2. Add to `src/locales/en.json` under `editor.tips`: `"<id>": { "title": "...", "body": "..." }`
3. Add to `src/locales/es.json` under `editor.tips`: `"<id>": { "title": "...", "body": "..." }`

Append new tips at the end of the `TIPS` array. Append new locale keys at the end of `editor.tips` in both files.

Do **not** modify `tips-carousel.jsx`, `status-bar.jsx`, or any component — tips are purely data.
