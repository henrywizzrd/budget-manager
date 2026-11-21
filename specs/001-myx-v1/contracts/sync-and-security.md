# Contract: Supabase schema, RLS and sync

## Migrations

All schema lives in `supabase/migrations/*.sql`, applied in order. One migration per change.

## Row Level Security (Constitution III, FR-012)

For every synced table in `data-model.md`:

- `alter table <t> enable row level security;`
- select / insert / update policies: `using (user_id = auth.uid())` and
  `with check (user_id = auth.uid())`.
- No delete policy for clients: deletes are soft (`deleted_at`). Hard deletion only happens in the
  `delete-account` function.
- `profiles.is_pro` and `ai_usage` are writable only by the service role (Edge Functions).
- A trigger sets `updated_at = now()` on insert and update, so the server clock decides conflicts.

## Sync protocol (FR-011, Constitution IV)

Per table, the client stores `last_pulled_at`.

1. **Push**: select local rows with `dirty = true`; upsert them in batches of ≤ 500. On success,
   clear `dirty` and store the returned `updated_at`.
2. **Pull**: select rows where `updated_at > last_pulled_at`, ordered by `updated_at`; merge into
   SQLite. When a local row is still dirty and the server row is newer, the server row wins and the
   local version is copied to a local-only `conflict_backup` table (table name, row id, JSON
   payload, time) so it can be recovered from History (edge case: never silently lost).
3. Run on sign-in, app foreground, after each local write (debounced 2 s), and on reconnect.

## Edge Functions

| Function | Caller | Purpose |
|---|---|---|
| `assistant` | app (Pro users) | cloud AI, see `assistant-actions.md` |
| `delete-account` | app (signed-in user) | hard-delete all rows for `auth.uid()` then the auth user (FR-014) |
| `revenuecat-webhook` | RevenueCat | set `profiles.is_pro` from entitlement events (shared-secret header) |

## Export (FR-013)

Done on the device from SQLite: one CSV per table zipped, shared via the system share sheet. Works
for guests too.
