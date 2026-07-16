# ADR-021: Monorepo workspace discovery + workspace-scoped scans

**Status:** Accepted

## Context

Phase-3 requirement (user-confirmed): CQMS must handle monorepos. The
chosen model (interview decision 3): a monorepo is registered ONCE at its
root; the app discovers its workspaces; trigger-scan offers whole-repo or
per-workspace scope; findings gain a workspace dimension. This also
resolves the Step-3/4 path-consistency note: with root registration,
every detail table's project-root-relative file paths line up with
workspace paths by plain prefix.

## Decision

### 1. Discovery — TypeScript, filesystem-only, best-effort

`ingestion/workspaces/` (scan-ingestion): `readWorkspaceGlobs`
(pnpm-workspace.yaml's `packages:` via a deliberate LINE parser — no YAML
dependency; falls back to package.json `workspaces`, array or
`{packages}` form) → `expandWorkspaceGlobSegments` (star segments fan out
over real subdirectories via the fs/\*Within containment gates,
node_modules never qualifies) → a directory is a workspace iff it
contains a package.json (pnpm's own rule) → paired with its package name
(`readPackageName`). `**` globs are deliberately unsupported (nothing
here uses them); every error degrades to `[]` — discovery must never
block registering or scanning. A new `fs/isExistingPathWithin` primitive
joins the existing containment-checked family.

### 2. Persistence — a snapshot, not an entity (migration 0013)

`cqms.project_workspaces` (project_id, workspace_path root-relative,
workspace_name, UNIQUE per project) with fact-table audit depth —
`fn_replace_project_workspaces` swaps the whole set (DELETE-then-INSERT,
idempotent). Refresh points: register + edit actions (best-effort,
non-fatal, against the STORED canonicalized path) and the trigger-scan
action. The trigger-scan LOADER performs a FRESH filesystem discovery
instead of reading the snapshot — a GET must not write, and the form
should offer what exists on disk right now; the ACTION re-discovers,
validates the selection against it (form values are
attacker-controllable), persists the snapshot, then creates the run.

### 3. Scoped runs — scanners × scopes (migration 0013)

`fn_create_run_with_scoped_scans(..., p_scopes jsonb)` cross-joins
requested scanners with `[{scope_type, scope_value}, ...]`; same
`pg_notify('cqms_scan_queued')` contract, so the orchestrator needed ZERO
changes (`--scope` already threads through to every runner: eslint/oxlint
run in the scope directory, fallow maps it to `-w`, agent skills receive
it in the prompt). `triggerScan.util` now always goes through the scoped
function — no selection means a single `{'repo','.'}` entry, making the
old single-scope behavior a strict subset; `fn_create_run_with_scans`
stays for existing callers. The UI adds a `workspacePaths` multi-select
(shared Form `mode: 'multi'`, rendered only when discovery finds
workspaces; empty = whole repo).

### 4. Attribution — longest-prefix views, never a stored column

`scan_finding_workspaces`, `fallow_file_score_workspaces`, and
`lint_violation_workspaces` (the plan named the first two; lint
violations want the same dimension for the same reason): LEFT JOIN
LATERAL picking the LONGEST `workspace_path` prefix of the row's
project-root-relative path — nested workspaces attribute to the deepest
match; unmatched rows keep NULL workspace columns (the "repo
root/unattributed" bucket is a signal, not an error). Views, not
columns: the workspace list can be re-discovered at any time and
attribution must follow, not fossilize.

## The bug the live E2E caught: resolveScan's uniqueness assumption

The first two E2E rounds failed the same way — one scan per (run,
scanner) pair died on `reports_scan_id_key`, its sibling "succeeded", and
in round 1 a third scan was left stuck `running` forever. Root cause:
`resolveScan`'s UI path located the scan by **(run_id, scanner_id) with
an unordered LIMIT 1** — unique before this ADR, ambiguous once a run
fans out as scanners × scopes (both eslint scans share a `created_at`).
The first eslint execution ingested its report into WHICHEVER row the
lookup returned (sometimes the other workspace's scan); the second
execution resolved to the same row and died on the reports UNIQUE
constraint, while its own row — never ingested — could be left `running`
(the observed zombie: queued-only reconciliation never rescues stale
`running` scans; noted as a pre-existing operational gap, not fixed
here).

Fix: the lookup is now **scope-qualified** — `(run_id, scanner_id,
scope_type, scope_value)` — and `triggerScan` deduplicates
`workspacePaths` so no two scan rows of a run can share that tuple.
Round 3 (two full 2×2 runs): **all 8 scans succeeded**.

## Verification performed

- Migration 0013 applied to live `cqms_db` (idempotent runner). Suites
  green under clean conditions (dev orchestrator stopped — the documented
  queue race otherwise steals test scans): scan-ingestion **148/148**
  (26 new: discovery-util tests over real temp-dir fixtures built with
  the fs/\*Within helpers, the `isExistingPathWithin` tests, the
  scanners×scopes fan-out test, and a real-DB workspaces test proving
  snapshot replace, folder-scoped scan creation, longest-prefix
  attribution incl. the NULL bucket, and wholesale re-replacement);
  admin_system 23/23; scan-orchestrator 9/9. Lint + typecheck clean
  everywhere.
- **Live UI E2E** (real login as admin, CQMS repo-root project):
  trigger-scan page rendered the workspace multi-select with the real
  discovered workspace list; POST with a bogus `workspacePaths` value
  returned the typed field error and created nothing; POST with
  eslint+oxlint × packages/ui+apps/admin_system fanned out to 4
  folder-scoped scans, **all succeeded** (after the resolveScan fix
  above). DB probes: two distinct `eslint_runs` masters in one run
  (packages/ui: files_linted=1545/9 suppressed; apps/admin_system:
  102/13); `lint_violation_workspaces` attributed every violation to
  exactly its workspace (13 → apps/admin_system, 9 → packages/ui, no
  NULL leakage); 15 workspaces persisted in `project_workspaces` with
  real package names. Verification runs deleted (cascade clean); the
  workspace snapshot kept.
