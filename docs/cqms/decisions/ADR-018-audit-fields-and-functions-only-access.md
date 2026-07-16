# ADR-018: Audit fields + functions-only database access

**Status:** Accepted

## Context

Phase-3 rule, confirmed with the user as a retrofit-everything decision:
**application code never touches cqms tables directly** — every read goes
through a view, every write through a function/procedure that takes the
acting user and checks `fn_assert_permission` (ADR-017) before touching
anything. Before this migration, several query utils did direct SQL
(`markScanRunning` UPDATEd `cqms.scans`, `getScanById` SELECTed the table,
`ingestReport` UPDATEd `raw_json` inline, `resolveScan` INSERTed scan rows),
and no table recorded who created or changed a row.

## Decision

### 1. Audit columns (migration `0009_audit_and_functions.sql`)

Entity tables (`projects`, `scanners`, `runs`, `scans`) gain the full set:
`created_by`/`edited_by` (FK → `cqms.users`), `edited_at`, `enabled`,
`deleted_at` (soft delete). Fact tables (`reports`, `scan_findings`,
`run_files`) gain **`created_by` only** — written once by ingestion, never
edited, removed via their parent scan's cascade (the confirmed
entities-full/details-lean convention).

### 2. Reads → views

New `v_projects` / `v_scanners` / `v_runs` / `v_scans` (all filtering
`deleted_at IS NULL`), `v_reports` / `v_scan_findings` (fact passthroughs,
so the never-touch-tables rule holds uniformly), plus two views that
absorb formerly hand-written joins: `v_queued_scans` (the orchestrator's
3-table queue read — soft-deleted scans/projects/scanners drop out of the
queue by construction) and `v_project_runs` (per-run severity rollups;
`getProjectRuns` keeps only filter + pagination). The 0003/0006 rollup
views (`project_run_summary`, `run_scan_summary`,
`project_scanner_trend`) were recreated with soft-delete filters.
Documented sharp edge: `SELECT *` views expand at CREATE time — a later
`ALTER TABLE ADD COLUMN` needs the affected view recreated to expose it.

### 3. Writes → functions, `p_user_id` first

Every write function takes the acting user as its FIRST parameter and
calls `fn_assert_permission` before any DML. Permission mapping:

| Function                          | Assertion                                 |
| --------------------------------- | ----------------------------------------- |
| `fn_upsert_project`               | `create project`                          |
| `fn_update_project` (new)         | `update project` + project id (grantable) |
| `fn_create_run`                   | `execute scan` + **project id**           |
| `fn_create_run_with_scans`        | via `fn_create_run`                       |
| `fn_create_ad_hoc_scan` (new)     | `execute scan` + project id               |
| `fn_mark_scan_running/failed`     | `update scan` + scan id                   |
| `fn_update_scan_progress` (new)   | `update scan` + scan id                   |
| `fn_set_scan_raw_artifacts` (new) | `update scan` + scan id                   |
| `sp_ingest_scan_result`           | `update scan` + scan id                   |

`fn_create_run` asserts with the **project** as the grantable resource so
both run-creating paths (UI trigger + ad hoc CLI) honor "user X may
execute scans only on project Y" instance grants through one check.
`fn_finalize_run_status` stays user-less deliberately — it is an internal
rollup only ever reached through already-asserted functions.

**Old signatures are DROPped, not kept as overloads** — a stale caller
fails loudly (`function does not exist`) instead of silently skipping the
permission check. Behavior is otherwise preserved exactly (same status
transitions, same 'Project not found.' error text, run still created
'running' by `fn_create_run` — no semantics changed mid-retrofit).

### 4. The acting user in TypeScript

Every write query util gained a `userId` arg. admin_system actions pass
`requireUser`'s user (and `trigger-scan` now records
`triggered_by = username` instead of null). Non-interactive actors
resolve the seeded **`system`** user via the new
`queries/getUserByUsername.util.ts`: the orchestrator once per queue
drain (deliberately not cached across the process lifetime — disabling
the system user stops the queue on the next wake), the ingest CLI once
per invocation (failing with a run-migrations hint if missing).
`IngestReportArgs` gained `userId`; `ingestReport`'s inline raw-json
UPDATE became `fn_set_scan_raw_artifacts`, and `resolveScan`'s direct
scan INSERT became `fn_create_ad_hoc_scan`.

## Consequences

- Deleting a project/run/scan can now be a soft delete (`deleted_at`)
  that every read surface respects automatically — the delete UI comes
  with Step 10.
- Every row written from now on carries a real actor; the pre-existing
  rows keep NULL audit fields (no backfill — nothing true to backfill
  with).
- All future tables/steps are born compliant: new reads get a view, new
  writes get a `p_user_id`-first function (Phase-3 steps 3–9 follow this
  shape).
- A revoked/disabled user is cut off at the DB layer even if a session
  or code path forgets an app-level check.

## Verification performed

- Migration 0009 applied cleanly to live `cqms_db`; re-run skipped.
- Completeness grep: zero `UPDATE/INSERT/DELETE cqms.*` and zero
  `FROM cqms.<table>` outside tests and migrations across scan-ingestion,
  scan-orchestrator, and admin_system source.
- Suites all green after the retrofit: scan-ingestion 76/76 (every
  affected real-DB test updated to the new signatures and the system
  user), scan-orchestrator 9/9 (including the real end-to-end
  deterministic-linter queue test), admin_system 23/23; typecheck + lint
  clean across all three.
- **Live E2E** (both dev servers, real login, real scan): logged in as
  `admin`, POSTed the real trigger-scan action for the `packages/ui`
  project, orchestrator picked it up via LISTEN/NOTIFY and the scan
  reached `succeeded`; then verified via direct DB query — run:
  `triggered_by='admin'`, `created_by=admin`; scan: `created_by=admin`,
  `edited_by=system` (the orchestrator's transitions), `edited_at` set;
  report: `created_by=system`. Verification run deleted afterward.
- Found two stale pre-retrofit orchestrator processes competing on port
  4100 during verification — killed both and restarted fresh so the E2E
  genuinely exercised the new code path (a stale orchestrator would have
  silently used the old direct-UPDATE code).
