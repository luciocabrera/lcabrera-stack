# Scan Orchestrator Architecture

Standalone background process that actually executes CQMS scans (Implementation
Plan step 9, ADR-015). Plain Node — no React, no Vite framework, no Express.
`apps/admin_system` never runs a scan itself; this is the only process that
does, and the only one that ever needs `ANTHROPIC_API_KEY`.

## Runtime

- Source entry point: `src/server.ts`, run directly via
  `node --experimental-strip-types` (no build step — matches
  `packages/scan-ingestion`'s own CLI/migration scripts, not
  `apps/api-server`'s `tsc`-then-`dist` pattern).
- HTTP server: plain `node:http`, only for the `/ws/runs` WebSocket upgrade
  and a bare `GET /healthz`.
- Database: `@repo/data-access`'s pooled `getPool()` for normal queries, plus
  one dedicated non-pooled `pg.Client` (`listenForQueuedScans.ts`) held open
  for `LISTEN cqms_scan_queued`.

## How a scan gets picked up

1. `trigger-scan`'s action (`apps/admin_system`) inserts `queued` rows via
   `fn_create_run_with_scans` — unchanged from before this step existed.
2. That DB function's last line is `PERFORM pg_notify('cqms_scan_queued', ...)`.
3. This process's dedicated `LISTEN` connection wakes `processQueue`'s
   `wake()`, which drains every currently-`queued` scan
   (`getQueuedScans()`) through a bounded worker pool
   (`runWithConcurrencyLimit`, sized by `MAX_CONCURRENT_SCANS` — the
   global host-protection cap of PRD_V2 §9 / ADR-033), so at most that
   many scans run on the host at once and the rest wait for a slot. Each
   scan is CLAIMED first (`fn_claim_queued_scan`, an atomic queued→running
   flip that reports whether this caller won — ADR-026); a lost claim is
   skipped silently, so a duplicate orchestrator, an overlapping wake, or
   two pool workers never execute a scan twice.
4. A reconciliation poll (every 30s, plus once on startup) re-checks the
   same query — the correctness backstop for `NOTIFY`'s fire-and-forget
   nature (dropped if nobody's listening when it fires).
5. Before any of that, startup sweeps stale `'running'` scans
   (`fn_fail_stale_running_scans`) — rows left behind by a previous
   process that died mid-run are failed with a re-trigger message and
   their runs finalized (deliberately NOT auto-requeued: a stale agent
   scan already burned API credit — ADR-026). This assumes a single
   active orchestrator, which is the deployment model (ADR-015).

## Job execution

`runQueuedScan.ts` branches on `scanners.deterministic` (TECH_SPEC §2.5):

- **Deterministic scanners** (eslint, oxlint — ADR-019's split of the
  retired `linter` — fallow since the ADR-019 addendum, and app-graph
  since ADR-022): looked up in
  `deterministicScannerConfigs.constants.ts` (`scanner_id →
{scriptPath, rawArtifactFileName}` — a TS map, not a DB column;
  executing DB-stored paths would widen the attack surface) and spawned
  as `node <scriptPath> --target=<local_path> --scope=<scope_value>
--output-dir=<dir> --skip-ingest`. A deterministic scanner with no
  registered runner fails with an explicit message instead of crashing
  the queue.
- **code-smell-checker / code-smell-zen** (not deterministic): calls
  `@repo/agent-runner`'s `runSkillAgent`, streaming `onProgress` into
  `scans.progress_message` and a `scan-progress` WebSocket push per turn.

Either branch ends in `ingestReport()` (success) or `markScanFailed()`
(failure) — both from `@repo/scan-ingestion`. Any unexpected exception is
caught at the top level and turned into a failed scan; it never crashes the
process.

## WebSocket protocol

- Connect to `ws://<host>:<port>/ws/runs`.
- Send `{ "type": "subscribe", "runId": "<uuid>" }` to start receiving that
  run's updates (validated, no further auth — internal tool).
- Messages: `{ type: 'scan-status', runId, scanId, scannerId, status }` on
  every status transition, `{ type: 'scan-progress', ... }` on every
  Agent SDK turn for the non-deterministic scanners.
- The client (`apps/admin_system`'s `useRunStatusSocket.hook.ts`) treats any
  message as "go revalidate," not as authoritative state — the loader stays
  the single source of truth.

## Env

- `SCAN_ORCHESTRATOR_PORT` (default `4100`)
- `ANTHROPIC_API_KEY` — required, Zod-validated at startup; never logged.
- `DB_HOST`/`DB_NAME`/`DB_PASSWORD`/`DB_PORT`/`DB_USER` — via
  `@repo/data-access`'s own schema, loaded the same way every other CQMS
  package loads them (`docker/local/.env` + a package-local `.env` override
  for `DB_NAME=cqms_db`).

## Running it

- `npm run dev` (this package) or `npm run dev:cqms` (repo root) — the
  latter starts this process and `admin_system` together via
  `pnpm --parallel`.
- `npm run start` — same entry, no `--watch`.
