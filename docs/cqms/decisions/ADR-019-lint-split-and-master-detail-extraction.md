# ADR-019: Lint split (eslint/oxlint) + per-scanner master/detail extraction

**Status:** Accepted

## Context

Phase-3 requirement (user-confirmed): every scanner gets a **master**
table (one row per scan, 1:1) and **detail** tables, so tool-specific
data stops being trapped in opaque jsonb (`scans.raw_json`) and becomes
queryable columns for analysis and metrics. The combined `linter`
scanner ran oxlint AND eslint in one scan — incompatible with the
one-master-per-scan model — so the user chose splitting it into two
independent scanners over bending the 1:1 rule.

## Decision

### 1. Scanner split (migration `0010_lint_split.sql`)

New `eslint` / `oxlint` scanner rows (both deterministic, both housed in
`.github/skills/linter-checker`); `linter` retired with
`is_active=false, enabled=false` — deliberately NOT soft-deleted, so
historical linter scans keep a resolvable scanner reference while the
trigger-scan list and the queue view exclude it. `scannerIdSchema` drops
`'linter'` entirely: nothing NEW can ingest as the combined scanner.

### 2. Master/detail tables

- **Masters, 1:1 via `scan_id` PRIMARY KEY**: `cqms.eslint_runs`
  (files_linted, error/fatal/warning counts, fixable counts,
  **suppressed_count**, rules_violated_count — distinct rules among
  ACTIVE messages only) and `cqms.oxlint_runs` (number_of_files,
  number_of_rules, severity split).
- **Detail**: one shared `cqms.lint_violations` table with a `source`
  CHECK discriminator rather than two per-tool copies — the shape is
  identical and cross-tool per-rule/per-file analytics want one table.
  Columns cover everything the raw output carries: rule_id,
  severity_raw (the tool's own value) + canonical severity, file_path
  (**project-root-relative** — the workspace-attribution prefix views in
  Step 7 depend on this), line/col/end positions, message/messageId,
  fixable, and **eslint's suppressedMessages as real rows**
  (`suppressed`, `suppression_kind`, `suppression_justification`) —
  baselined lint debt is queryable data, not noise.
- Per-file aggregates are the `lint_file_stats` VIEW (run_file_stats
  precedent — no second app-maintained copy of the same fact). Fact-table
  audit depth per ADR-018: `created_by` + `created_at` only.

### 3. Extraction pipeline

`ingestReport` → `ingestScanDetail` (new internal dispatcher, NOT in
`package.json` exports) → per-scanner: loose Zod parse of the raw
artifact (every field defaulted — version drift degrades to partial
extraction, never throws on shape surprises) → pure extractors
(`ingestion/lint/*.util.ts`, relative imports for the plain-Node CLI
path) → `sp_ingest_eslint_detail` / `sp_ingest_oxlint_detail`
(`p_user_id`-first per ADR-018, DELETE-then-INSERT scoped by source —
idempotent re-ingestion, which also makes a future backfill over
historical `raw_json` safe).

**Log-and-continue**: detail extraction runs AFTER `sp_ingest_scan_result`
committed the generic layer; a failure there logs a warning and leaves
the scan `succeeded`. The generic findings + verbatim raw_json are never
hostage to the columnar explosion.

### 4. Runner scripts

`generate-linter-report.mjs` was deleted and split into
`generate-eslint-report.mjs` / `generate-oxlint-report.mjs` over a shared
`lint-report-shared.mjs` (arg/target-mode parsing, finding-id hashing,
templated report.md, best-effort CQMS ingest). Behavior preserved:
config-detection skip (no eslint flat config / no oxlint config → a
valid 0-findings report, per-tool no-config message), `toolFailures`
graceful degradation, legacy positional mode running `vp lint` for
oxlint. Raw artifacts gained kind discriminators:
`{kind:'eslint', results}` / `{kind:'oxlint', ...}`. The SKILL.md now
runs both scripts; `.claude/settings.json` allowlists both.

### 5. Orchestrator dispatch generalization

`runDeterministicLinter` (hardcoded script path) became
`runDeterministicScan` driven by `DETERMINISTIC_SCANNER_CONFIGS`
(`scanner_id → {scriptPath, rawArtifactFileName}`) — the map Steps 4
(fallow) and 8 (app-graph) plug into. **A TS map, not a DB column**:
executing DB-stored script paths widens the attack surface, and a new
deterministic scanner needs an on-disk script (a code change) anyway. A
deterministic scan whose scanner has no registered runner (a stale
queued `linter` scan, or a registry-added scanner whose script was never
created) fails with an explicit message instead of crashing the queue.

## Consequences

- Trigger-scan now offers eslint and oxlint independently (the scanner
  list is data-driven — zero UI changes needed).
- Suppressed-debt tracking is live: per-rule active/suppressed splits
  via `getScanLintRuleSummary` and per-file via `lint_file_stats`.
- Historical `linter` scans remain readable but gain no new siblings; a
  stale queued linter scan fails loudly with a clear reason.
- The detail pipeline is the template Steps 4/5/8 follow (fallow,
  code-smell masters, app-graph).

## Verification performed

- Migration 0010 applied to live `cqms_db`; suites green after the
  retrofit: scan-ingestion **90/90** (14 new: 11 extractor unit tests +
  3 real-DB `getScanLintRuleSummary` tests covering per-rule rollup,
  master 1:1 row, and DELETE-then-INSERT idempotency via a real
  procedure call), scan-orchestrator 9/9 — its end-to-end queue test now
  exercises the real `generate-eslint-report.mjs` via the config map.
  Lint + typecheck clean; `validate-skills.cjs` passes.
- Standalone script check: `generate-oxlint-report.mjs --target=<packages/ui>`
  produced all three artifacts with the graceful no-config 0-findings
  report.
- **Live E2E** (both dev servers, real login as admin): triggered
  eslint+oxlint on the `packages/ui` project via the real UI action —
  both scans succeeded through the orchestrator's new dispatch. DB
  probes: `eslint_runs` master shows **files_linted=1521,
  suppressed_count=9, 0 active** and `lint_violations` holds the 9 real
  suppressed rows (directive-kind, e.g.
  `security/detect-non-literal-fs-filename` in
  `browseDirectory.loader.ts`) with project-relative paths;
  `oxlint_runs` shows the graceful empty run (no oxlint config at that
  path); both scans' `raw_json` carry their kind discriminators; masters'
  `created_by` = the system user. Deleting the verification run
  cascade-removed every master/detail row.
