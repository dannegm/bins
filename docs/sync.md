# Real-time Sync

Bins uses two separate Supabase Realtime channels per editor session:

- **Awareness channel** (`bin:<binId>:awareness`) — Presence: tracks who is online and which file they have active.
- **Structure channel** (`bin:<binId>:structure`) — Broadcast: propagates structural changes (bin title, readonly toggle, file create/rename/delete).
- **Yjs channel** (`bin:<binId>:file:<fileId>`) — Broadcast: propagates CRDT document updates and sync handshake for each open file.

All channels use `{ config: { broadcast: { self: false } } }` so a client never processes its own messages.

---

## Yjs sync protocol

Each file has a Y.Doc managed by `src/services/yjs.js`. The sync protocol is a request/response handshake:

### On join

1. A new Y.Doc is created **empty** — no content is inserted at this point.
2. The client subscribes to the Yjs broadcast channel.
3. On `SUBSCRIBED`, it immediately sends `yjs:sync-request`.
4. A 300 ms fallback timer is started.

### On receiving `yjs:sync-request` (peer already in channel)

The existing peer responds with `yjs:sync-response` containing its full encoded CRDT state (`Y.encodeStateAsUpdate`).

### On receiving `yjs:sync-response` (joining client)

- The fallback timer is cancelled.
- The peer's CRDT state is applied via `Y.applyUpdate(yDoc, state, 'remote')`.
- `onReady` callback fires → Monaco mounts and shows the synced content.

### On fallback timer expiry (no peers responded)

- If `initialContent` (from `file.content` in DB) is non-empty, it is inserted into Y.Text via `yDoc.transact(() => yText.insert(0, initialContent), 'init')`.
- `onReady` fires → Monaco mounts.

### Live updates

Every local change (origin = `clientId`) is broadcast as `yjs:update`. Peers apply it with `Y.applyUpdate(yDoc, update, 'remote')`.

---

## Origin tagging

Every Yjs transaction has an origin string used for filtering:

| Origin | Source | Broadcast? | Save? | Applied to Monaco? |
|---|---|---|---|---|
| `clientId` | Local user typing | Yes | Yes | No (already in Monaco) |
| `'remote'` | Peer update or sync-response | No | No | Yes |
| `'init'` | Fallback insert from DB content | No | No | No |

The save observer in `EditorCore` skips `'remote'` and `'init'`. The `yDoc.on('update')` broadcast handler skips `'remote'` and `'init'`. The Monaco yText observer skips `clientId` and `'init'`.

---

## Why the Y.Doc starts empty (critical invariant)

**Do not pre-insert `file.content` into Y.Doc at initialization time.**

If every client inserts the same text string independently, each creates its own set of CRDT operations tied to its own client ID. When two clients sync via the handshake, Yjs preserves both sets of operations and concatenates them — resulting in duplicated content. This compounds on every refresh.

The correct pattern: only one client inserts the initial content — either the first client to open the file (via the 300 ms fallback timer), or the joining client receives the content from an existing peer (via `yjs:sync-response`). Subsequent clients always receive the state from the peer, never insert independently.

### The bug this fixed (content duplication)

**Symptoms:**
- Host writes content, guest opens the link → host sees content duplicated in real time.
- On each refresh (by either client), content multiplied again (2×, 3×, …).
- Duplication was only visible locally on each client; did not propagate in real time, but the duplicated state was saved to DB on the next write, making it permanent.

**Root cause (two interacting bugs):**

1. Every client called `yText.insert(0, file.content)` synchronously at `initYDoc`. Two clients joining the same file each had independent CRDT insertions of the same text. On sync, Yjs merged both → `"hello" + "hello" = "hellohello"`.

2. The `$isApplyingRemote` flag in Monaco's binding was reset synchronously (`$isApplyingRemote.current = false`) immediately after `model.setValue` / `model.applyEdits`. If Monaco dispatched `onDidChangeModelContent` asynchronously (next microtask or macrotask), the flag was already false. The handler then wrote the full (duplicated) content back to Y.Text with `clientId` origin → it was broadcast to peers and saved to DB.

**Fix:**

- `initYDoc` starts with an empty Y.Doc. Content arrives from peers (fast path) or from DB after 300 ms (fallback). Only one source of truth per session.
- `$isApplyingRemote` is now reset via `setTimeout(..., 0)` to guarantee the flag is still true for any asynchronously dispatched Monaco events.
- The `EditorCore` save observer also filters `'init'` origin to avoid redundant DB writes on the initial content load.

---

## Monaco ↔ Yjs binding (`src/components/editor/monaco-editor.jsx`)

The binding useEffect runs when `yText` is first set (after `onReady`):

1. `model.setValue(yText.toString())` — sets Monaco's initial content from the already-populated Y.Text.
2. `$isApplyingRemote` stays `true` until the next event loop tick (via `setTimeout`), blocking any async Monaco events from writing back to Y.Text.
3. `editor.onDidChangeModelContent` is registered — forwards user edits to Y.Text as `clientId`-origin transactions.
4. `yText.observe(observer)` is registered — applies remote/peer deltas from Y.Text back to Monaco, guarded by `$isApplyingRemote`.

---

## Structure sync (`src/pages/editor.jsx`)

File and bin metadata changes use plain Broadcast (no CRDT):

| Event | Payload | Effect |
|---|---|---|
| `bin:updated` | `{ title?, is_readonly? }` | Updates local `bin` state |
| `file:created` | `{ file }` | Appends to file list (deduped by id) |
| `file:updated` | `{ file }` | Merges into matching file in list |
| `file:deleted` | `{ fileId }` | Removes from list, switches active tab if needed |

The author (creator) always broadcasts after a successful DB write. Other clients apply the broadcast and update their local state — they never write to DB for structural changes.

---

## Known edge cases

**Simultaneous first join (race condition):** If two clients open the same file at exactly the same time and neither has an existing peer, both start empty and neither gets a `yjs:sync-response` within 300 ms. Both fall back to inserting from DB independently → duplication occurs. This is extremely rare in practice (requires two clients opening the exact same file in the same ~300 ms window with no existing session). The `ydoc_state` column (bytea) in `bin_files` exists to solve this properly in the future: store the serialized Y.Doc state on every save and restore from it on load, making both clients' states byte-identical and sync a no-op.

**Readonly guests and Yjs:** Readonly guests still participate in the Yjs sync (they receive and display peer changes) but the `EditorCore` save observer is not registered when `readOnly = true`, so they never write to DB. Their Monaco editor is `readOnly` and cannot generate user-origin events.
