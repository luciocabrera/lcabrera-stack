# ADR-023: Scanner registry + artifact generation

**Status:** Accepted

## Context

Phase-3 requirement (interview decision 8): scanners become registrable
from the UI. The registration form captures everything the pipeline knows
about a scanner; the app assembles missing on-disk artifacts from
templates; and until a developer writes a bespoke migration, a new
scanner's detail data lands in an auto-created generic detail table plus
the generic layer. **Code stays authoritative** throughout: the registry
row describes a scanner, it never becomes the thing that executes.

## Decision

### 1. Registry schema (migration 0015)

`cqms.scanners` grows description, `version` (int, default 1),
`command_template` (documentation of the runner invocation with
`{target}/{scope}/{outputDir}` placeholders — metadata ONLY; the
orchestrator still executes `DETERMINISTIC_SCANNER_CONFIGS`' code-owned
script paths, never DB-stored commands), `raw_artifact_file_name`,
`config_detection` (jsonb), `allowed_tools` (jsonb), `steps_markdown`.
`cqms.scanner_versions` snapshots the registry fields (audit columns
stripped) at every version, `UNIQUE (scanner_id, version)`, cascade from
the scanner row. `v_scanners` is `CREATE OR REPLACE`d because a
`SELECT *` view expands its column list at creation time — the 0009
version would silently miss the new columns. Existing scanners are
backfilled (descriptions, command templates and raw-artifact names for
the deterministic four, the Agent-SDK allowlist for the code-smell pair)
and each gets its v1 snapshot; their `steps_markdown` stays NULL — the
SKILL.md on disk is authoritative.

### 2. Write functions

`fn_register_scanner(p_user_id, p_scanner jsonb) → scanner_id` asserts
'create' on 'scanner' (admin-only per the 0008 seeds), validates the id
against `^[a-z0-9][a-z0-9-]{0,47}$` (the sanitized detail-table name must
stay under Postgres' 63-char identifier limit), rejects duplicates with a
typed message, inserts at version 1 and snapshots.
`fn_update_scanner(p_user_id, p_scanner_id, p_scanner jsonb) → version`
asserts 'update', coalesces per-field (absent keys keep current values),
bumps the version and snapshots. `scanner_id` and `skill_path` are
immutable — natural key and code-owned artifact location.

### 3. Generic detail table + ingest

`fn_create_scanner_detail_table(p_user_id, p_scanner_id)` — dynamic DDL
with the identifier sanitized (`-`→`_`, `^[a-z0-9_]{1,48}$` allowlist)
and always applied through `format('%I')`: creates
`cqms.scanner_detail_<id>` (`scan_id` FK cascade, `payload jsonb`, fact
audit) + index + `v_` view, idempotently. It runs at REGISTRATION time
(the UI action), not at ingest — the ingesting orchestrator user
shouldn't need (and might not have) DDL-granting permissions.
`sp_ingest_generic_detail(p_user_id, p_scan_id, p_rows jsonb)` resolves
the scan's scanner, DELETE-then-INSERTs one row per jsonb array element,
and raises a clear message when the table is missing.

On the TS side, `scannerIdSchema` stops being a closed enum (format-only
regex validation now; existence authority moved to `scans.scanner_id`'s
FK), and `ingestScanDetail` gains a fallback branch: any scanner id
without a bespoke extractor goes through
`extractGenericDetailRows` — a top-level `rows` array (the scaffolded
contract), a bare array, or a single whole-artifact row — into
`sp_ingest_generic_detail`, wrapped by ingestReport's existing
log-and-continue.

### 4. Artifact generation (`packages/scan-ingestion/src/registry/`)

`writeScannerArtifacts` assembles missing artifacts into
`.github/skills/<id>/` at register/edit time: `buildSkillMarkdown` (the
hand-written skills' frontmatter shape) for LLM scanners,
`buildRunnerScriptScaffold` (wired to
`deterministic-scan-shared.mjs` with a marked `TODO(parser)` block; emits
a valid 0-findings report so a half-registered scanner degrades
gracefully — verified by executing a generated scaffold unattended) for
deterministic ones. **Strictly create-if-missing** — an existing file is
never touched. All writes go through the `fs/*Within` containment gates
against the repo root (resolved module-relative, the orchestrator's
`cqmsRepoRoot` technique). Artifact generation is best-effort in the
actions: the committed registry row never rolls back over a filesystem
failure. The skills validator classifies script-only directories as
non-skill dirs, so scaffolded deterministic scanners don't need SKILL.md.

### 5. UI (`/cqms/scanners`)

List / `new` / `edit/:scannerId` / `view/:scannerId` under the cqms
layout, plus a "Scanners" nav item. The list is the first consumer of the
Table's **crud metadata**: `metaState.crud = {create, read, update}` with
`scanner_id` as the `isPrimaryKey` column — the header create link and the
per-row view/edit actions come entirely from the Table, no hand-rolled
link columns. No `delete`: scanners soft-retire via `is_active` (the
`linter` precedent). The view page shows the registry fields plus the
version history. Forms mirror new/edit-project (shared `Form`,
Zod-in-action, typed field errors; the DB exception messages surface as
field errors). Checkbox parsing is strict native semantics
(`isCheckboxChecked`: exactly `'on'`) — a crafted empty-string value must
not read as true, caught live during E2E.

## Verification performed

- Suites green: scan-ingestion **170/170** (14 new: template/scaffold
  builders, repo-root resolution, artifact writer incl. the
  never-overwrite guarantee, generic-rows extraction, and a real-DB
  registry flow test — register/duplicate/bad-id, idempotent detail-table
  creation, version bump + snapshot history, and a registered scanner
  going through trigger-scan + `sp_ingest_generic_detail` into its
  generic detail view); admin_system **24/24**; lint + typecheck clean;
  migration 0015 applied to live `cqms_db`.
- **Live UI E2E** (real login as admin): registered `zz-dummy-e2e`
  through the real form → 302 to its view page; DB row v1 + snapshot;
  `cqms.scanner_detail_zz_dummy_e2e` + view created; runner scaffold
  generated on disk, `node --check` clean, and **executed unattended**
  producing all three canonical artifacts (raw + 0-findings report.json +
  report.md). The scanner appeared in trigger-scan's options while
  active. Edit flow: rename + deactivate → version 2, both snapshots
  preserving their historical state, and the scanner disappeared from
  trigger-scan. A crafted `supportsDiffScope=` (empty string) POST
  initially registered as `true` — fixed by the strict checkbox
  coercion and re-verified as `false`. Dummy fully cleaned afterwards
  (row + cascade, dropped table, removed artifacts).
