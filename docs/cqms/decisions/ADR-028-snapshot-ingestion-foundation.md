# ADR-028: Snapshot ingestion foundation (CodePulse Phase 1)

**Status:** Accepted
**Supersedes:** ADR-014 (the `path` field / `PathBrowserModal` / `browseDirectory` half — the Form Cancel/discard half stays in force), ADR-016 (the `resolveLocalPath` canonicalization half — the scan-status toast half stays in force).
**Amends:** ADR-006/007 (schema + ingestion identity), ADR-012 (project registration/trigger routes), ADR-021 (workspace-discovery root).

## Context

[PRD_V2.md](../PRD_V2.md) (2026-07-11) redefines CQMS as **CodePulse**, a hosted multi-developer platform: a project's code **syncs from the developer's machine to the server** (CLI push + browser archive upload, sync-then-scan, latest snapshot wins), scans execute server-side, and **the platform never exposes its own filesystem to users**. The full audit is at [2026-07-11-codepulse-alignment-review.md](../reviews/2026-07-11-codepulse-alignment-review.md); this ADR implements Phase 1 of its backlog — the ingestion foundation — and records the decisions that Phase's code embodies.

A **clean break** was confirmed: existing `local_path`-registered projects and their scan history are dev data — dropped, not migrated. Migrations are **stacked** (0027+), not re-baselined: provenance stays readable in the numbered sequence, and a dev database is simply re-provisioned.

## Decision

### 1. Snapshot model — `cqms.project_snapshots` + `projects.latest_snapshot_id`

Migration `0027_project_snapshots.sql`:

- New fact table `cqms.project_snapshots` (`id`, `project_id` FK, `storage_path`, `archive_name`, `size_bytes`, `file_count`, `source_label`, `created_by`, `created_at`). Rows are **historical metadata** (which sync happened, by whom, from what source); only the **latest snapshot's files** are retained on disk — replacing a snapshot deletes the previous storage directory but keeps its row, so run history keeps its metadata without keeping code (PRD §3).
- `cqms.projects` gains `latest_snapshot_id` and **drops `local_path`** (and its unique constraint). Project identity is now the row id alone — the old match-by-canonical-path upsert semantics retire with the column.
- `fn_upsert_project` → replaced by `fn_register_project(p_user_id, p_name)` (plain INSERT; registration no longer carries a path). `fn_update_project` drops `p_local_path`. New `fn_set_project_snapshot(...)` inserts the snapshot row and repoints `latest_snapshot_id` in one call (asserts `update` on the project instance — syncing code is mutating the project).
- `fn_create_run_with_scoped_scans` now **rejects when the project has no snapshot** (ERRCODE `55000`, same pattern as 0021's active-run guard). The check lives here — the UI trigger entry point — not in `fn_create_run`, because the ad-hoc CLI ingestion path (evidence import for runs that happened elsewhere) legitimately has no snapshot.
- `v_projects`, `v_queued_scans`, `project_run_summary` recreated: `local_path` out, snapshot columns in (`v_queued_scans` now exposes `snapshot_path` — the latest snapshot's storage directory — as the orchestrator's scan target).
- UUIDv7 defaults and `is_readonly` are **deferred** to their own migration (audit report §4.9): both are sweeping cosmetic changes that would bloat this already-structural migration.

### 2. Ingestion identity — `projectId` + `targetRootPath` replace `localPath`

`IngestReportArgs.localPath` served two unrelated jobs: project **identity** (ad-hoc match-by-path) and the **relativization root** for lint file paths / file inventory. It splits accordingly:

- `projectId?` — ad-hoc identity. The ad-hoc branch of `resolveScan` now **requires** an existing project id instead of upserting by path (`ingest.cli.ts`: `--local-path` → `--project-id` + `--target-root`). The UI path derives it from the run, as before.
- `targetRootPath` — the directory the scan actually ran against (snapshot dir for UI runs, checkout for ad-hoc). `ingestScanDetail` and the lint extractors rename their `localPath` arg to match.
- `matchProject.util.ts`'s git-root-walking `resolveProjectPath` and `resolveLocalPath.util.ts` are **deleted**; the surviving need (stamping ad-hoc runs with branch/SHA) moves to `readGitMetadata.util.ts` (same `execFileSync` + `TRUSTED_PATH` hygiene).

### 3. Browser archive upload — first sync channel

- `saveProjectSnapshot.util.ts` (scan-ingestion `ingestion/snapshots/`) unpacks an uploaded **zip** (via `fflate`, the repo's first archive dependency) into `<CQMS_SNAPSHOTS_DIR>/<projectId>/<snapshotId>/`, with a **zip-slip guard** (every entry resolved and required to stay under the target dir), records it through `fn_set_project_snapshot`, and deletes the previous snapshot's directory. `CQMS_SNAPSHOTS_DIR` is Zod-validated env with an OS-tmpdir default.
- `projectDetail.action.ts` gains an `intent === 'sync-upload'` branch (multipart via native `request.formData()` — Node ≥ 20 `File`), and the project page gains a **`ProjectSyncPanel`** (route-local component, same placement pattern as `ProjectGrantsPanel`) showing last-sync metadata and the upload form. Workspace discovery (ADR-021) runs **here**, against the fresh snapshot — it leaves the registration/edit actions entirely, since those no longer know any path.
- The **CLI push channel + per-user API tokens** (PRD §3's primary channel) are the next increment, not this one — browser upload is the complete-but-minimal first path that makes the model real end-to-end.

### 4. Registration/edit/trigger without paths

`new-project`/`edit-project` shrink to `name` only. `trigger-scan`'s loader/action discover workspaces from `project.snapshot_path` (none ⇒ empty) and the trigger form is gated on a snapshot existing (`hasSnapshot`), with the DB-side rejection as the authoritative backstop — the same three-layer pattern 0021 established for the active-run guard.

### 5. Path-browse surface removed

`PathField/` (incl. `PathBrowserModal/`), `routing/browseDirectory.loader.ts` (+types/tests), admin_system's `_action/browse-directory` route, and the `path` leaf type (`PathFieldDef`, registry entry) are deleted. This closes the audit's misalignment #4 (server-filesystem exposure as a feature).

### 6. Interim bridge until Phase 2 (containers)

The orchestrator still executes on the host and the LISTEN/NOTIFY queue still stands — Phase 2 replaces both — but scans now target the **snapshot directory** (`scan.snapshot_path`), never a user-named server path. Known interim limitation: snapshots carry no `.git`, so `code-smell-zen`'s diff scope fails against them until PRD §14.1 (git metadata in CLI push) is resolved — accepted, recorded here deliberately.

## Consequences

- The server's filesystem is no longer reachable from any user input: paths are never accepted, stored, or browsed; scan targets are always platform-managed snapshot directories.
- Ad-hoc/interactive skill self-ingest (ADR-009) breaks until skills pass `--project-id` — acceptable: that flow is scheduled to move server-side in Phase 2, and ingest failures there were always best-effort by design.
- `packages/ui`'s `Form` loses its only filesystem-coupled leaf type; the component is again fully environment-agnostic.
- Anyone re-running an existing checkout must re-provision the CQMS database (clean break) and re-register projects, then sync a snapshot before triggering scans.

## Verification performed

Quality gate (fmt, lint, typecheck, tests) run across `packages/ui`, `packages/scan-ingestion`, `apps/admin_system`, `apps/scan-orchestrator`; new unit tests cover the zip extraction (zip-slip rejection included), snapshot persistence wiring, and the reworked registration/trigger actions. See the PR/commit for the exact run output.
