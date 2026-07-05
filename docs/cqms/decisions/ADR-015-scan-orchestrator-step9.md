# ADR-015: Step 9 — standalone `scan-orchestrator` process

**Status:** Accepted

## Context

Implementation Plan Step 9 — the last of the 9 steps — makes `trigger-scan`
actually do something: until now it only inserted `queued` run/scan rows
(TECH_SPEC §2.7's original single-process design was superseded by ADR-014's
follow-up two-process redesign, discussed and confirmed with the user before
any code was written). This ADR records what building that design actually
produced, including two real bugs discovered along the way that weren't
visible until this step forced every prior piece to run together for real.

## Decision

### 1. `apps/scan-orchestrator` — a new, plain Node process

No React, no Vite, no React Router, no Express. `apps/admin_system` is
**completely untouched** — still stock `react-router dev`/`@react-router/serve`.
The new process owns three things end to end: noticing a queued scan,
running it, and pushing its status over WebSocket — all in one process, so
"publish a status update" is a plain function call, not a cross-process
bridge (the whole point of the two-process split over the original design).

Package layout mirrors `apps/api-server`'s "plain Node app" conventions
(`vite.config.ts` via `createApiLintConfig`, generator-produced tsconfig)
but runs directly via `node --experimental-strip-types` (no build step),
matching `packages/scan-ingestion`'s own CLI/migration scripts rather than
`api-server`'s `tsc`-then-`dist` pattern — this process has no bundling
need either way.

```
apps/scan-orchestrator/
├── src/
│   ├── server.ts                    # entrypoint: env, http+ws server, queue wiring, shutdown
│   ├── cqmsRepoRoot.util.ts         # mirrors agent-runner's own
│   ├── config/env.schema.ts         # SCAN_ORCHESTRATOR_PORT, ANTHROPIC_API_KEY (DB_* via @repo/data-access)
│   ├── ws/
│   │   ├── createHttpServer.ts      # plain node:http + /healthz
│   │   ├── attachWebSocketServer.ts # ws.WebSocketServer at /ws/runs, zod-validated subscribe
│   │   └── runStatusHub.ts          # Map<runId, Set<WebSocket>>
│   └── queue/
│       ├── listenForQueuedScans.ts  # dedicated LISTEN client, reconnect-with-backoff
│       ├── processQueue.ts          # sequential drain loop, re-entrancy-safe wake()
│       └── runQueuedScan.ts         # the actual per-scan execution + branch
```

### 2. Discovery-and-fix #1: `pg_notify` + a real durability backstop

`fn_create_run_with_scans` (migration `0007_scan_queued_notify.sql`) gains
one line — `PERFORM pg_notify('cqms_scan_queued', v_run_id::text)` — so
`trigger-scan`'s action and `triggerScan.util.ts` need **zero changes**.
`listenForQueuedScans.ts` holds one dedicated, non-pooled `pg.Client`
(`LISTEN` requires keeping the connection open) and calls back into
`processQueue`'s `wake()` on every notification.

`NOTIFY` is fire-and-forget — verified directly, not assumed: killed the
orchestrator, queued a scan via `fn_create_run_with_scans` (confirmed the
row sat at `'queued'` with the orchestrator down), restarted it, and
confirmed the **startup reconciliation drain** (`getQueuedScans()`, called
once on boot and every 30s thereafter) picked it up and ran it to
`'succeeded'` with no other trigger. This is the correctness backstop for
the gap `NOTIFY` itself can't cover, not a decorative extra.

### 3. Discovery-and-fix #2: `linter-checker`'s script only ever worked against this repo

Flagged explicitly before writing orchestrator code (confirmed with the
user which of two fixes to make): `generate-linter-report.mjs` computed its
own `repoRoot` from `import.meta.url` — always this CQMS repo, regardless
of what should have been scanned — and shelled out to `vp lint`, this
repo's own tool, which an arbitrary registered project has no reason to
have. Fixed by generalizing the script (`--target=<abs>` for an arbitrary
project, `--scope=`, `--output-dir=`, `--skip-ingest`), switching to raw
`oxlint`/`eslint` detected via the target's own config files in target
mode, and adding real resilience: a target project's own broken tooling
(verified live against a real sibling repo with an actual broken
transitive dependency) now degrades to a report noting the tool failure
instead of crashing the whole scan. The legacy positional-argument
interactive-skill invocation (`node ... apps/react-router`) is provably
unchanged — same code path, same `repoRoot`, verified against a real
subfolder before and after.

### 4. Job execution — same branch as always planned, executing for real now

`runQueuedScan.ts`: mark `running`, publish, branch on
`scanners.deterministic` (§2.5) — linter via the generalized script above
(child process, `--skip-ingest` since the orchestrator calls `ingestReport`
itself with the `runId` it already has), the other three via
`@repo/agent-runner`'s `runSkillAgent` (`onProgress` writes
`scans.progress_message` and publishes a `scan-progress` message per
turn). Any unexpected error — from either branch — is caught and turned
into `markScanFailed`, not a crashed orchestrator; one bad scan must not
take down the queue for every other project.

Four new `packages/scan-ingestion` query utils back this (`getQueuedScans`,
`markScanRunning`, `markScanFailed`, `updateScanProgress`), each with real
`cqms_db` integration tests — no mocks, matching this package's existing
convention.

### 5. Discovery-and-fix #3: a package.json `exports` map is exclusive, not additive

Added a plain-Node-resolvable `exports` map to `@repo/scan-ingestion` and
`@repo/agent-runner` (both were previously importable only via
Vite/tsconfig-path aliasing — fine for `admin_system`, which is
Vite-mediated, but `apps/scan-orchestrator` is the first plain-`node`
consumer of either from _outside_ their own package). First attempt only
listed the 4 new query utils + `ingestReport` — which **broke every other
already-working subpath** for any tool that resolves `exports` strictly
(confirmed: `admin_system`'s own `vp lint` pass, which does, started
failing across the entire `cqms` routes tree with "cannot find module"
the moment the field was added, even though nothing about those routes
had changed). Fixed with a scoped wildcard —
`"./queries/*.util": "./src/queries/*.util.ts"` — public by directory
convention (every file in `queries/` already is one), while
`ingestion/*`'s genuinely-internal helpers (`buildFileInventory`,
`matchProject`, `report.schema`, etc.) stay unexported, keeping the
original intentional boundary.

### 6. Discovery-and-fix #4: the tsconfig generator was already drifted, and running it exposed that

`packages/ts-configs/generate.ts` is the source of truth for every
generator-tracked `tsconfig.app.json` (ADR-003). Adding `scan-orchestrator`'s
entry and re-running it silently **wiped** `admin_system`'s
`@repo/data-access`/`@repo/scan-ingestion`/`@repo/ui` path aliases — the
generator's own `admin_system` entry had never been updated after those
aliases were hand-added directly to the JSON file at some earlier point,
so it was destined to regress the moment anyone re-ran the generator for
any reason. Fixed at the source (`generate.ts`'s own entry, not just the
output file) so this can't happen again; re-ran the generator afterward
and confirmed byte-for-byte parity (after `vp fmt`) with the pre-regression
file, plus a clean `vp lint`/`tsc` pass across `admin_system`.

### 7. Client wiring

`useRunStatusSocket.hook.ts` (new, `apps/admin_system/src/hooks/`) opens a
WebSocket inside a `useEffect` (a legitimate case — synchronizing with an
external system) to `VITE_SCAN_ORCHESTRATOR_WS_URL` (new
`ImportMetaEnv` field, defaults to `ws://localhost:4100/ws/runs`), sends
`{ type: 'subscribe', runId }`, and calls `useRevalidator().revalidate()`
on any message — the socket is a cache-invalidation signal, not a data
channel, so there's no second data contract to keep in sync with the
loader's. `RunDetail.component.tsx` is the first consumer. Basic
reconnect-with-backoff on close; the callback ref pattern (not a raw
`revalidator` dependency) avoids re-subscribing the socket on every
render without needing an `eslint-disable`.

### 8. Running both processes together

New root script: `dev:cqms` — `pnpm --parallel --filter admin-system
--filter @repo/scan-orchestrator run dev`, mirroring the existing
`dev`/`dev:fast` convention for the car-sales apps.

## Consequences

- Trigger-scan is now real: a queued scan actually executes, for all four
  scanners, and the UI can watch it happen live.
- `apps/admin_system` never needed a single line changed to its own
  server/dev setup — the two-process split's central promise, delivered.
- The `linter-checker` skill is now genuinely reusable against any
  registered project, not just this repo — a real capability gap closed,
  not merely worked around for this feature.
- `@repo/scan-ingestion`/`@repo/agent-runner` are now real, properly
  bounded plain-Node-importable packages — the first cross-package,
  non-Vite consumer surfaced (and forced a fix for) a resolution gap that
  every future Node-context consumer would otherwise have hit blind.

## Verification performed

All against the real, already-running `docker/local` Postgres — no mocked
DB anywhere in this step:

- **`packages/scan-ingestion`**: 56 tests (14 files) passing, including 5
  new tests for the 4 new query utils; `tsc`/`vp lint` clean.
- **`packages/agent-runner`**: 12 tests (3 files) passing, unaffected.
- **`apps/scan-orchestrator`**: 9 tests (3 files) — `runStatusHub` (pure
  logic), `attachWebSocketServer` (a real `ws` client against a real
  `http.Server`), and a real end-to-end `runQueuedScan` linter-branch test
  (spawns the real script, ingests a real report); `tsc`/`vp lint` clean.
- **`apps/admin_system`**: 15 tests unaffected; `tsc`/`vp lint`/custom-rules
  eslint all clean (after fixing discovery #3 and #4 above).
- **Live, manual, end-to-end, with real data — not simulated**:
  1. Registered a real project, triggered a real `linter` scan through
     `fn_create_run_with_scans` while the orchestrator was running:
     `NOTIFY` → real wake → real script execution → real `ingestReport()` →
     `run`/`scan` reached `'succeeded'` with real `files_analyzed`/`top_risk`
     — confirmed via `psql` against the real rows, not application logs.
  2. A second run with a live WebSocket client subscribed via the real
     `/ws/runs` endpoint received real `{status: 'running'}` then
     `{status: 'succeeded'}` messages, in order.
  3. Killed the orchestrator, queued a scan (confirmed stuck at
     `'queued'`), restarted it, confirmed the startup reconciliation drain
     picked it up with zero other trigger and completed it.
  4. Triggered a real `fallow` scan (the non-deterministic/agent-runner
     branch) — this **actually ran a live Claude Agent SDK session**
     against a real target, streamed real `scan-progress` WebSocket
     messages turn-by-turn, and completed with a genuinely real report:
     95 files analyzed, 6 medium findings, 8 `scan_findings` rows
     ingested, real prose in `top_risk`. This is the first real, live,
     non-interactive execution of an Agent-SDK-driven scanner anywhere in
     CQMS.
  5. `dev:cqms` started both processes together from a clean state;
     `/healthz` and `/cqms/projects` both returned `200`.
  6. All test data (projects, runs, scans, reports, findings) deleted
     afterward; no leftover `.tmp` scratch directories.
