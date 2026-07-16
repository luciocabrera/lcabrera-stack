# ADR-029: CLI push + per-user revocable API tokens (CodePulse Phase 1 remainder)

**Status:** Accepted
**Amends:** ADR-028 (adds the CLI push channel + per-user API tokens it explicitly deferred as "the next increment"), ADR-017 (adds a Bearer-token auth path alongside the cookie session), ADR-021 (CLI push runs the same post-sync workspace discovery as the browser upload).

## Context

[PRD_V2.md](../PRD_V2.md) §3 makes **CLI push the primary sync channel** (a CLI packs the repo honoring ignore rules and pushes it to the platform — scriptable, real repo sizes, CI-usable), and §12/§14.3 require the CLI to authenticate with **per-user revocable API tokens** issued from a profile page. ADR-028 landed the snapshot model + the browser upload channel and named this the next increment. This ADR delivers it.

Decisions locked with the owner (2026-07-14): both slices ship in one increment; the CLI **extends `packages/scan-ingestion`** (not a standalone package); snapshots stay **whole-tree** (git metadata / diff scoping deferred); the reusable token primitives live in the becoming-public `packages/data-access`.

## Decision

### 1. Token model + schema — `0028_api_tokens.sql`

- `cqms.api_tokens`: an entity table (full audit set; `enabled`/`deleted_at` for soft-revoke) with `user_id` FK, `token_id` (public indexed lookup half), `token_hash` (scrypt hash of the secret half — **never** exposed), `name`, `last_used_at`, `expires_at`. Columns are bounded `varchar` per ADR-030.
- A token's plaintext is `cqms_<tokenId>.<secret>`: `tokenId` is a public lookup; only the secret's scrypt hash is stored. `cqms.v_api_tokens` is the read view and omits `token_hash` (as `v_users` omits `password_hash`).
- Functions: `fn_issue_api_token` (self-service — the actor mints tokens for their own account with no role permission, the `fn_set_user_password` model), `fn_get_api_token_secret` (the sole hash-returning path — consumed only by `verifyApiToken`, the `fn_get_user_credentials` analogue; returns no row for a revoked/expired token or disabled owner), `fn_touch_api_token` (records last use), `fn_revoke_api_token` (soft-delete; owner or `update:user` on the owner).

### 2. Token code placement — generic primitives vs CQMS queries

- **`packages/data-access/src/tokens/`** (generic, DB-free, reusable — no product value baked in): `generateApiToken` / `parseApiToken` (both take the `prefix` as a **parameter**), `hashApiToken` / `isApiTokenValid` (scrypt `<saltHex>:<hashHex>`, `timingSafeEqual`, mirrors the password utils). Per the vital-packages directive, these stay product-agnostic; CodePulse supplies `cqms_` from scan-ingestion.
  > **Amended 2026-07-16 (location only):** "mirrors the password utils" turned out to mean "duplicates them" — fallow flagged `isApiTokenValid` ↔ `isPasswordValid` as a clone group in a vital package, where the rule is always-fix-never-baseline. `hashApiToken` / `isApiTokenValid` are therefore **gone**, replaced by `packages/data-access/src/crypto/` `hashSecret` / `isSecretHashValid`, which both passwords and token secrets call directly. `generateApiToken` / `parseApiToken` are unaffected and still live in `tokens/`. Do not reintroduce domain-named wrappers over the crypto pair — fallow's `thin-wrapper` rule is an error, so a rename-only delegate just trades one finding for another.
- **`packages/scan-ingestion/src/queries/`** (CQMS-domain, real-DB): `issueApiToken`, `verifyApiToken`, `listApiTokens`, `revokeApiToken`. The secret hash is hashed/compared inside this package and never crosses to the frontend (ADR-017 invariant preserved). The `cqms_` prefix constant lives in `scan-ingestion/src/auth/`.

### 3. `requireApiUser` + the push endpoint

- `requireUser` rejects with a **302 redirect to `/login`** (cookie-based) — useless to a CLI. New `apps/admin_system/src/auth/requireApiUser.util.ts` reads `Authorization: Bearer <token>`, calls `verifyApiToken`, and throws **`data('Unauthorized', { status: 401 })`** on any failure, returning the owning `userId`.
- `POST /_action/push-snapshot/:projectId` is a **resource route** (`routes/api/push-snapshot/`, `root.ts` re-exports only `action`) registered **outside the `cqms` layout** — that layout's loader runs `requireUser` (cookie → 302), which a CLI cannot follow. It authenticates via the token, does a cheap `checkUserPermission({ action: 'update', resourceType: 'project', resourceId })` **pre-flight** (fail fast before writing the archive to disk — a faithful mirror of the `fn_assert_update_permission` that `fn_set_project_snapshot` asserts, per 0020), reads the raw body (`request.arrayBuffer()`), and reuses the exact browser flow: `saveProjectSnapshot({ sourceLabel: 'cli:<host>' })` + best-effort `replaceProjectWorkspaces(discoverProjectWorkspaces(...))`. Body is buffered in memory (like the browser sync) and capped by env `CQMS_MAX_PUSH_BYTES` (default 500 MB) → `413`.

### 4. The CLI + packer (extends `scan-ingestion`)

- `packProjectArchive.util.ts`: an in-memory fflate zip of the project tree, honoring the shared `IGNORED_DIRECTORIES` (extracted from `buildFileInventory` into `ignoredDirectories.constants.ts` so packer and inventory can't drift; a push never uploads `node_modules`/`.git`/build output). Zip keys are **POSIX-normalized** so the linux server's `extractZipArchive` zip-slip guard matches regardless of the developer's OS separator. Non-files (symlinks) are skipped.
- `push.cli.ts`: packs `--root` (default cwd) and POSTs to `--url`/`CODEPULSE_URL` with `Authorization: Bearer` from `CODEPULSE_TOKEN` (or `--token`, discouraged). Runs via a `push` package script (`node --experimental-strip-types`); **no `bin`** yet — distribution is a later increment. `readBinaryFileWithin.util.ts` (containment-guarded byte read) and `parseCliFlags.util.ts` (shared by the ingest + push CLIs) support it.

### 5. Profile UI

`routes/cqms/account-tokens/` — a **self-service** page gated on `requireUser` only (a user manages their own tokens). Loader lists live tokens (no hash); the action routes `token-issue` (returns the plaintext **exactly once**) / `token-revoke` intents (fetcher + intent, mirroring the project grants editor). The bare `CqmsLayout` `<Outlet/>` gained a minimal top nav so the page (and the sibling sections) is reachable.

### 6. Deferred (recorded so the boundaries are explicit)

Git metadata / diff-based scanning (PRD §14.1 — a CLI-only follow-up: the CLI would compute + upload a diff manifest and `code-smell-zen` consume it); a token **`scopes`** column (YAGNI — one token-auth path this increment; a token is already bounded by its owner's RBAC); the `409` per-project concurrency lock (last-write-wins for now, Phase 2); `/ws/runs` auth (Phase 2); a published `bin`; true streaming upload (fflate is synchronous/in-memory both ends).

## Consequences

- The CLI push channel is real end-to-end; tokens are the auth for it and a foundation for the Phase-2 token-authenticated trigger.
- **Testing:** pure primitives (`data-access/tokens`, `packProjectArchive`, `parseCliFlags`, `requireApiUser`) unit-tested with no DB; the CQMS token queries are real-DB integration tests (issue→verify round-trip; wrong/unknown/revoked/expired/disabled-owner all reject). The thin endpoint + CLI wiring is validated by the end-to-end drive (issue → CLI push → revoke).
- **Watch-out:** the push endpoint buffers the whole archive in memory; the cap bounds it but true large-repo support needs streaming (deferred).
