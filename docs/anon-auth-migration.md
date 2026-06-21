# Supabase Anonymous Sign-Ins — Migration Analysis

> **Purpose:** Cost/feasibility analysis for replacing the current `x-client-id` header identity system with Supabase's native Anonymous Sign-Ins. This is a pre-implementation reference, not a task checklist.

---

## Current System (baseline)

Every user gets a UUID generated client-side via `crypto.randomUUID()` on first visit (`src/helpers/identity.js`). It is persisted in localStorage (`src/services/settings.js`) and injected into every Supabase request as a custom header:

```js
// src/services/supabase.js
global: { headers: { 'x-client-id': uuid } }
```

All 19 RLS policies (across 4 tables) plus 2 security-definer functions and 1 security-definer RPC extract this UUID via:

```sql
current_setting('request.headers', true)::json->>'x-client-id'
```

All requests use the **`anon`** Postgres role. There is no Supabase Auth session.

---

## What Supabase Anonymous Sign-In Is

`supabase.auth.signInAnonymously()` creates a real Supabase Auth user without requiring any credentials. Key technical properties:

- Returns a signed JWT containing `{ is_anonymous: true }` in its claims
- The JWT is sent automatically on every subsequent Supabase request (no manual header injection needed)
- The request uses the **`authenticated`** Postgres role — not `anon`
- The session is stored and managed by the Supabase Auth client in localStorage
- The user's UUID is now server-generated and lives in `auth.users.id`
- Can later be promoted to a permanent account via `updateUser()` (email/phone) or `linkIdentity()` (OAuth)

The `is_anonymous` claim is accessible in RLS policies via `auth.jwt()->>'is_anonymous'` and the user's UUID via `auth.uid()`.

---

## What Would Change

### Database / RLS — High effort

Every identity check must be rewritten. Currently:
```sql
current_setting('request.headers', true)::json->>'x-client-id'
```
Becomes:
```sql
auth.uid()::text
```

**Scope:**
- 19 RLS policies across `bins.profiles`, `bins.bins`, `bins.bin_files`, `bins.bin_collaborators`
- `bins.requesting_user_is_admin()` security-definer function
- `bins.get_bin_access()` security-definer RPC
- All `GRANT ... TO anon` statements on tables change to `GRANT ... TO authenticated`

This is one new migration file (`migrations/007_anon_auth_rls.sql`) that drops all existing policies and recreates them, plus an update to `db.sql`.

The rewrite itself is mechanical — the logic doesn't change, only the identity accessor.

---

### `src/services/supabase.js` — Low effort

Remove the manual header injection. The client factory simplifies to a standard `createClient()` call with no `global.headers`. The JWT is included automatically after sign-in.

---

### `src/providers/identity-provider.jsx` — Medium effort

`initIdentity()` currently generates a UUID, stores it, and calls `syncProfile()`. With anonymous auth, the UUID comes from the auth session:

```js
// Before
const uuid = crypto.randomUUID();
settings.set('user.uuid', uuid);

// After
const { data: { session } } = await supabase().auth.getSession();
const { data } = session ? { data: { session } } : await supabase().auth.signInAnonymously();
const uuid = data.session.user.id;
```

The rest of `initIdentity()` (name generation, color generation, `syncProfile()`) stays identical — the UUID is just sourced differently.

---

### `src/helpers/identity.js` — Low effort

The `generateUUID()` function becomes unused and can be removed. `generateName()` and `generateColors()` are unaffected.

---

### `src/constants/default-settings.js` + `src/hooks/use-identity.js` — Low effort

`user.uuid` no longer needs to be stored in settings (it comes from the auth session). Two options:

| Option | Implication |
|--------|-------------|
| Remove `uuid` from settings | `supabase().auth.getUser()` used for synchronous reads (async) |
| Keep as a cached copy | Simpler synchronous access; slightly redundant |

The cached-copy approach is lower-risk and avoids threading async calls into sync contexts.

---

### Admin system — No change

The admin claim flow (JWT to external endpoint → sets `is_admin` in DB) is unaffected. `is_admin` remains a DB column. The `requesting_user_is_admin()` function just swaps to `auth.uid()`.

---

### Bot cleanup cron — Medium effort

The current cron (`migrations/004_add_bot_cleanup_cron.sql`) deletes rows from `bins.profiles` where `is_bot = true`. With anonymous auth, deleted profiles still leave zombie `auth.users` records. The cron must also call:

```sql
-- requires service-role key or pg_net + Supabase management API
select supabase_admin.delete_user(uuid) from bins.profiles where is_bot = true;
```

Alternatively, use a Supabase Edge Function as the cron target, which has access to the Admin API. This is a new migration (`migrations/008_update_bot_cleanup.sql`) + updated `db.sql`.

Additionally: anonymous users who naturally abandon the app (no bot flag) accumulate in `auth.users` indefinitely. A second weekly cron should delete `auth.users` where `is_anonymous = true AND created_at < now() - interval '30 days'`.

---

## What Stays the Same

| Aspect | Status |
|--------|--------|
| Registration UX | Fully invisible — no sign-in form, no UI changes |
| localStorage persistence | Still lost on clear (same as today) |
| UUID-based bin ownership | Same ownership model, different UUID source |
| Name + color generation | Unchanged — still seeded from the UUID |
| Yjs / Realtime sync | Untouched — operates independently of auth |
| Collaborator tracking | Unchanged — `bin_collaborators.user_id` still a UUID |
| Profile upsert flow | Same — `syncProfile()` sends the same data |

---

## The Existing Data Problem

This is the migration's hardest constraint.

**The problem:** Every current user's UUID was generated client-side. All their bins, files, and profile rows are keyed by that UUID. Supabase Auth generates its own UUIDs server-side — they will not match existing records.

| Strategy | Effort | Trade-off |
|----------|--------|-----------|
| **Hard cut** | Zero | New UUID on next visit. All existing bins become orphaned (no owner). Acceptable pre-launch. |
| **Batch migration via Admin API** | Very high | Supabase Auth allows creating users with custom UUIDs via `supabase.auth.admin.createUser({ id: existingUuid })`. Feasible but requires a one-time migration script and service-role key. |
| **Dual-key transition period** | High + ongoing | Keep both `x-client-id` and JWT auth simultaneously. RLS policies double in complexity. Technical debt. |
| **Re-association bridge** | Medium | On first new sign-in, detect old UUID in localStorage, upsert a bridge record, reassign bins via SQL. Requires a temporary `old_uuid` column and migration RPC. |

**Recommendation for this project:** Hard cut. The app is pre-launch. No real user data to lose. When approaching a public launch with real users, revisit the batch migration via Admin API — it's the cleanest path that preserves existing data without complexity.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rate limit: 30 anon sign-ins/hour per IP | Medium | One sign-in per browser session; real users hit this once. Supabase dashboard allows raising the limit or disabling it. |
| Zombie Auth accounts (no auto-cleanup) | Medium | Weekly cron to delete `auth.users` where `is_anonymous = true AND created_at < now() - 30d` |
| Existing data orphaned | High (post-launch) | Only relevant after public launch; plan strategy before shipping |
| Bot cleanup requires Admin API | Medium | Cleanup cron needs service-role key; consider migrating to an Edge Function |
| Supabase Auth adds latency | Low | ~1 JWT validation per request; negligible at this scale |
| Must enable in Supabase dashboard | Trivial | Authentication → Sign-in providers → Anonymous — one toggle |

---

## Security Gain

The current `x-client-id` header is **not verified by Supabase**. Any client can send any UUID in that header and impersonate any user. RLS policies trust it blindly.

Supabase Anonymous Sign-In issues a **signed JWT**. The UUID inside the token is cryptographically bound to the session — it cannot be forged without the JWT secret. This is a meaningful improvement in RLS correctness and makes impersonation attacks significantly harder.

---

## Effort Summary

| Area | Effort | Files |
|------|--------|-------|
| Supabase dashboard toggle | Trivial | — |
| RLS migration (all policies + functions + RPC) | High | `migrations/007_anon_auth_rls.sql`, `db.sql` |
| Supabase client | Low | `src/services/supabase.js` |
| Identity provider | Medium | `src/providers/identity-provider.jsx` |
| Identity helpers | Low | `src/helpers/identity.js` |
| Settings / hooks | Low | `src/constants/default-settings.js`, `src/hooks/use-identity.js` |
| Bot cleanup cron | Medium | `migrations/008_update_bot_cleanup.sql`, `db.sql` |
| **Total** | **Medium-High** | ~6–8 files + 2 migrations |

Estimated implementation: **1–2 focused sessions**, assuming no existing data migration. The RLS rewrite is the bulk of the work and is mechanical but must be done carefully.

---

## Verdict

**Recommended: Migrate — before public launch, not before the app is feature-stable.**

Benefits outweigh costs:

1. **Security** — JWT identity is verifiable; `x-client-id` is not. The current system has a real impersonation attack surface.
2. **Future-proofing** — Anonymous → linked account (email, OAuth) becomes possible without any architectural rework.
3. **Standard patterns** — `auth.uid()` in RLS is the documented Supabase way; community tooling, AI assistants, and Supabase support all assume it.
4. **Foundation** — Enables "export my bins," "recover my account," and similar features that users will expect eventually.

**Do it as a dedicated task once the current feature set is stable.** The RLS migration is the riskiest step — test thoroughly in a staging Supabase project before running on production.
