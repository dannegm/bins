---
name: create-theme
description: >
  Add a new UI + Monaco theme from a VS Code theme JSON URL.
  Fetches the JSON, validates it, maps colors to CSS variables and Monaco token rules,
  creates all necessary files, and appends the theme to both arrays in themes.js.
  Invoke as: /create-theme <url-to-vscode-theme-json>
---

You are adding a new theme to the Bins project. The user has provided a URL to a VS Code theme JSON file as the argument to `/create-theme`.

## Step 0 — Fetch and validate

Fetch the URL. If it's a GitHub file page (github.com/…/blob/…), convert it to the raw URL (raw.githubusercontent.com/…/main/…) before fetching.

**Validation — reject and stop if ANY of these fail:**
- The content is valid JSON
- Has a top-level `name` string field
- Has a top-level `colors` object with at least `editor.background`
- Has a top-level `tokenColors` array with at least one entry
- `type` field (if present) is `"light"` or `"dark"`

If validation fails, tell the user exactly what's wrong and stop. Do not create any files.

## Step 1 — Derive the theme slug and label

- **label**: the `name` field from the JSON, cleaned up (remove version numbers like "l-03:", trim whitespace)
- **slug**: kebab-case of the label, lowercased, ASCII only (e.g. "Tlapalli Quartz Light" → `tlapalli-quartz-light`)
- **isDark**: `true` if `type === "dark"`, `false` otherwise (default `false` when absent)

Check that `src/css/themes/{slug}.css` does not already exist and that neither `UI_THEMES` nor `MONACO_THEMES` in `src/constants/themes.js` already contain `id: '{slug}'`. If duplicate, tell the user and stop.

## Step 2 — Map VS Code colors → CSS custom properties

Extract these tokens from the `colors` object. When a key is missing, use the fallback shown.

| CSS variable | VS Code key (primary) | Fallback |
|---|---|---|
| `--background` | `editor.background` | `sideBar.background` |
| `--foreground` | `activityBar.foreground` | `editor.foreground` |
| `--card` | `editorWidget.background` | `--background` slightly tinted |
| `--card-foreground` | same as `--foreground` | |
| `--popover` | `editorWidget.background` | same as `--card` |
| `--popover-foreground` | same as `--foreground` | |
| `--primary` | same as `--foreground` | |
| `--primary-foreground` | same as `--background` | |
| `--secondary` | `editor.lineHighlightBackground` | `list.inactiveSelectionBackground` |
| `--secondary-foreground` | same as `--foreground` | |
| `--muted` | `editor.lineHighlightBackground` | same as `--secondary` |
| `--muted-foreground` | `sideBar.foreground` | `tab.inactiveForeground` (strip alpha) |
| `--accent` | same as `--muted` | |
| `--accent-foreground` | same as `--foreground` | |
| `--destructive` | `list.errorForeground` | `editorError.foreground` |
| `--border` | `activityBar.border` | `sideBar.border` |
| `--input` | same as `--border` | |
| `--ring` | `badge.background` | `editorBracketMatch.border` |
| `--surface` | `list.inactiveSelectionBackground` | same as `--secondary` |
| `--surface-raised` | `peekViewResult.matchHighlightBackground` | `button.background` |
| `--brand` | `textLink.foreground` | `tab.activeBorder` (strip alpha) |
| `--brand-foreground` | same as `--background` | |
| `--accent-hover` | darker/stronger variant of `--brand` | `list.highlightForeground` |
| `--success` | `gitDecoration.addedResourceForeground` | use `#2e7d32` if no green exists in palette |
| `--warning` | `list.warningForeground` | `editorWarning.foreground` |
| `--warning-foreground` | light warm neutral (e.g. `#fff8f0`) | `--background` |
| `--overlay` | `oklch(0 0 0 / 20%)` for light, `oklch(0 0 0 / 30%)` for dark | |

Chart colors — pick 5 accent colors from the palette, ordered light→dark (or vivid→subtle for dark themes):
```
--chart-1 through --chart-5
```

Sidebar tokens — mirror the main tokens using sidebar-specific VS Code keys when available:
```
--sidebar              → sideBar.background
--sidebar-foreground   → sideBar.foreground
--sidebar-primary      → same as --primary
--sidebar-primary-foreground → same as --primary-foreground
--sidebar-accent       → same as --secondary
--sidebar-accent-foreground → same as --foreground
--sidebar-border       → sideBar.border
--sidebar-ring         → same as --ring
```

Always include: `--radius: 0.625rem;`

**Color cleaning rules:**
- Strip alpha from 8-digit hex colors (`#rrggbbaa` → `#rrggbb`) when setting named tokens
- Do NOT strip alpha from `selectionBackground`, `lineHighlightBackground` etc. that intentionally use transparency in Monaco editor colors

## Step 3 — Map VS Code tokenColors → Monaco rules

Read the `tokenColors` array. For each entry, map VS Code scopes to Monaco token names using this table:

| Monaco token | VS Code scope (match any) |
|---|---|
| `''` (default) | `none`, or derive from `editor.foreground` |
| `comment` | `comment`, `punctuation.definition.comment` |
| `keyword` | `keyword` (non-operator) |
| `keyword.control` | `keyword.control`, `keyword.other` |
| `keyword.operator` | `keyword.operator` |
| `storage` | `storage` |
| `storage.type` | `storage.type` |
| `storage.modifier` | `storage.modifier` |
| `string` | `string`, `constant.other.symbol`, `entity.other.inherited-class` |
| `string.escape` | `constant.character.escape`, `punctuation.section.embedded` |
| `string.regexp` | `string.regexp` |
| `number` | `constant.numeric` |
| `constant` | `constant` (non-numeric) |
| `constant.language` | `constant.language` |
| `entity.name.function` | `entity.name.function`, `meta.require`, `support.function.any-method` |
| `support.function` | `support.function` |
| `function` | derive from `entity.name.function` |
| `member` | derive from `support.function` |
| `type` | `entity.name.type.class`, `support.class`, `entity.name.class` |
| `type.identifier` | same as `type` |
| `entity.name.type` | same |
| `entity.name.class` | same |
| `support.class` | same |
| `class` | same |
| `interface` | same |
| `namespace` | same |
| `variable` | `variable` |
| `variable.language` | derive from default foreground |
| `variable.parameter` | `variable.parameter.function`, `support.type.property-name.json` |
| `parameter` | same as `variable.parameter` |
| `property` | derive from `variable` |
| `entity.other.attribute-name` | `entity.other.attribute-name` (non-ID) |
| `operator` | `keyword.operator` |
| `delimiter` | `punctuation.definition` scopes |
| `punctuation` | same |
| `tag` | `entity.name.tag` |
| `tag.id`, `tag.class`, `metatag` | same as `tag` |
| `metatag.content` | derive from `string` |
| `attribute.name` | `entity.other.attribute-name` |
| `attribute.value` | derive from `string` |
| `attribute.value.number` | derive from `number` |
| `delimiter.html` | derive from `delimiter` |
| `attribute.name.css` | derive from `type` / `support.class` |
| `attribute.value.css` | derive from `string` |
| `number.css` | derive from `number` |
| `unit.css` | derive from `number` |
| `selector` | `meta.selector` |
| `key.css` | derive from `type` |
| `emphasis` | `markup.italic` → `fontStyle: 'italic'` |
| `strong` | `markup.bold` → `fontStyle: 'bold'` |
| `keyword.md` | `markup.heading` → color from heading scope |
| `string.link.md` | `string.other.link` |

**Rules format:** `{ token: 'name', foreground: 'rrggbb' }` — no `#` prefix, no alpha. Add `fontStyle` only when the VS Code entry has an explicit `fontStyle`.

Always include the default rule first: `{ token: '', foreground: 'xxxxxx', background: 'yyyyyy' }`

## Step 4 — Monaco editor colors

Take these directly from the VS Code `colors` object:

```js
'editor.background'
'editor.foreground'
'editor.lineHighlightBackground'      // keep transparency if present
'editor.lineHighlightBorder'          // force '#00000000'
'editor.selectionBackground'          // keep transparency
'editor.inactiveSelectionBackground'  // keep transparency
'editor.selectionHighlightBackground' // keep transparency
'editorCursor.foreground'
'editorLineNumber.foreground'
'editorLineNumber.activeForeground'
'editorIndentGuide.background1'
'editorIndentGuide.activeBackground1' // keep transparency
'editorWhitespace.foreground'
'editorBracketMatch.background'       // append '00' to make transparent if not already
'editorBracketMatch.border'
'editorGutter.background'             // use editor.background if missing
```

## Step 5 — Create the CSS file

Write `src/css/themes/{slug}.css`:

```css
[data-theme='{slug}'] {
    --background: {value};
    --foreground: {value};
    --card: {value};
    --card-foreground: {value};
    --popover: {value};
    --popover-foreground: {value};
    --primary: {value};
    --primary-foreground: {value};
    --secondary: {value};
    --secondary-foreground: {value};
    --muted: {value};
    --muted-foreground: {value};
    --accent: {value};
    --accent-foreground: {value};
    --destructive: {value};
    --border: {value};
    --input: {value};
    --ring: {value};
    --chart-1: {value};
    --chart-2: {value};
    --chart-3: {value};
    --chart-4: {value};
    --chart-5: {value};
    --radius: 0.625rem;
    --sidebar: {value};
    --sidebar-foreground: {value};
    --sidebar-primary: {value};
    --sidebar-primary-foreground: {value};
    --sidebar-accent: {value};
    --sidebar-accent-foreground: {value};
    --sidebar-border: {value};
    --sidebar-ring: {value};
    --surface: {value};
    --surface-raised: {value};
    --accent-hover: {value};
    --success: {value};
    --warning: {value};
    --warning-foreground: {value};
    --overlay: {value};
    --brand: {value};
    --brand-foreground: {value};
    --hljs-comment: {comment color from tokenColors};
    --hljs-keyword: {keyword color from tokenColors};
    --hljs-string: {string color from tokenColors};
    --hljs-number: {constant.numeric color from tokenColors};
    --hljs-function: {entity.name.function color from tokenColors};
    --hljs-class: {entity.name.class / support.class color};
    --hljs-attr: {entity.other.attribute-name color};
    --hljs-tag: {entity.name.tag color};
    --hljs-builtin: {support.function / support.class color};
    --hljs-variable: {variable color};
    --hljs-meta: {meta / preprocessor / markup.heading color};

    background-color: var(--background);
}
```

**`--hljs-*` tokens** power syntax highlighting in Markdown code blocks (via `src/css/hljs-theme.css`). Derive each value from the `tokenColors` array mapped in Step 3 — use the same colors chosen for the Monaco rules. For `inherit: true` themes (light/dark shadcn), use the VS Code default token colors: dark=(`#569cd6` keyword, `#ce9178` string, `#6a9955` comment, `#b5cea8` number, `#dcdcaa` function, `#4ec9b0` class, `#9cdcfe` attr, `#c586c0` meta), light=(`#0000ff`, `#a31515`, `#008000`, `#098658`, `#795e26`, `#267f99`, `#001080`, `#af00db`).

## Step 6 — Register the CSS import

Append to `src/css/themes/index.css`:
```css
@import './{slug}.css';
```

## Step 7 — Append to themes.js

Open `src/constants/themes.js`.

**IMPORTANT: Always append at the END of both arrays. Never insert in the middle.**

1. Append to `UI_THEMES`:
```js
{ id: '{slug}', label: '{label}', isDark: {true|false} },
```

2. Append to `MONACO_THEMES` (after the last existing entry, before the closing `]`):
```js
{
    id: '{slug}',
    label: '{label}',
    isDark: {true|false},
    preview: {
        bg: '{editor.background}',
        keyword: '{keyword color}',
        string: '{string color}',
        comment: '{comment color}',
        text: '{default foreground}',
    },
    definition: {
        base: '{vs|vs-dark}',  // 'vs' for light, 'vs-dark' for dark
        inherit: false,
        rules: [ /* all rules from Step 3 */ ],
        colors: { /* all colors from Step 4 */ },
    },
},
```

3. Add an entry to `THEME_ATTRIBUTIONS` (the object exported just below `UI_THEMES`).

   The attribution object supports `name`, `nick`, or both — use whichever apply:
   - Both name and nick → displays as `"Name (@nick)"`
   - Nick only → displays as `"@nick"`
   - Name only → displays as `"Name"`

   ```js
   '{slug}': { name: '{Full Name}', nick: '{handle}', license: '{license}', url: '{repo-url}' },
   ```

   If you cannot determine the author info from the JSON or its GitHub page, ask the user before proceeding. Never leave `name` and `nick` both absent.

## Step 8 — Append to json-view-themes.js

Open `src/constants/json-view-themes.js` and append a new entry to `JSON_VIEW_THEMES`.

This is a base16 color object used by `ThemedJsonView` to syntax-color JSON output in the JS runner.

**Color mapping guide** (derive from the colors already chosen in Step 2):

| base16 key | Role in JsonView | Source |
|---|---|---|
| `base00` | background | `--background` |
| `base01` | lighter bg | `--surface` |
| `base02` | selection bg | `--surface-raised` |
| `base03` | brackets, punctuation | `--muted-foreground` |
| `base04` | secondary text | midpoint between muted-fg and fg |
| `base05` | default foreground | `--foreground` |
| `base06` | lighter fg | slightly toward `--foreground` |
| `base07` | brightest | white (dark) or darkest (light) |
| `base08` | null / undefined / errors | `--destructive` |
| `base09` | numbers | `--warning` or a warm orange that reads on this bg |
| `base0A` | misc (classes) | amber/yellow harmonizing with the palette |
| `base0B` | strings | `--success` or a readable green |
| `base0C` | regex / escape chars | a cyan/teal that fits the palette |
| `base0D` | **object keys** | `--brand` |
| `base0E` | **booleans** | a purple or secondary accent |
| `base0F` | deprecated | a muted red or pink |

For **light** themes: syntax colors must be darker (700–800 shade equivalent) to stay readable on the light background.
For **dark** themes: syntax colors can be lighter (300–400 shade equivalent).

```js
'{slug}': {
    scheme: 'bins-{slug}',
    author: 'bins',
    base00: '{--background}',
    base01: '{--surface}',
    base02: '{--surface-raised}',
    base03: '{--muted-foreground}',
    base04: '{midpoint}',
    base05: '{--foreground}',
    base06: '{near fg}',
    base07: '{brightest}',
    base08: '{--destructive}',
    base09: '{number color}',
    base0A: '{yellow/amber}',
    base0B: '{--success or green}',
    base0C: '{cyan/teal}',
    base0D: '{--brand}',
    base0E: '{purple/secondary accent}',
    base0F: '{muted red/pink}',
},
```

## Step 9 — Confirm

Report to the user:
- Theme name and slug
- Whether it's light or dark
- The 5 files modified/created (CSS, index.css, themes.js ×3 changes, json-view-themes.js)
- The brand color chosen and why
- Any colors that had no direct VS Code equivalent and what fallback was used
