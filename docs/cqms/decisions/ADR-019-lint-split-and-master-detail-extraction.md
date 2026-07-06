# ADR-019: Lint split (eslint/oxlint) + per-scanner master/detail extraction

**Status:** Accepted (addenda: deterministic fallow — Step 4; code-smell masters — Step 5)

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

---

## Addendum (Step 4): deterministic fallow + master/detail

**Migration `0011_fallow_deterministic.sql`.** This ADR's template applied
to fallow — the user-confirmed decision that fallow becomes deterministic
(`fallow --format json` run directly, like the linters), while LLM triage
stays interactive-only via the unchanged `/fallow-code-checker` skill.

### Runner: generate-fallow-report.mjs

`.github/skills/fallow-code-checker/scripts/generate-fallow-report.mjs`
honors the shared flag contract (`--target/--scope/--output-dir/
--skip-ingest`). Key choices:

- **fallow binary resolved from THIS repo's node_modules**
  (`createRequire().resolve('fallow/package.json', {paths:[repoRoot]})`,
  same technique as `scripts/refresh-fallow-complexity-report.cjs`) — an
  arbitrary registered target needs no fallow install or config.
- **fallow runs from the target's git root** (where workspace config
  lives); when the target sits below its git root the difference becomes
  the `-w` workspace scope (e.g. target `<repo>/packages/ui` →
  `-w packages/ui`). File paths are therefore stored exactly as fallow
  reports them: **relative to the scanned repo's git root**, which equals
  project-root-relative for root-registered projects (the canonical model;
  Step 7's workspace attribution relies on this).
- **The JSON artifact on disk is the success signal** — fallow's exit code
  is not load-bearing. Missing/unparseable output degrades to a 0-findings
  report in target mode (failure noted in `top_risk`, stub raw artifact
  keeps the contract), hard-exits in legacy mode. `fallow.raw.json` is
  fallow's own verbatim output, not a wrapper.
- **Deterministic severity mapping** (the skill's step-5 category table,
  minus the human-judgment adjustments): unresolved imports / unlisted
  deps / unused **prod** deps → HIGH; unused files/exports, dev/optional
  deps, circular deps, clone groups → MEDIUM; unused types → LOW; health
  findings critical→HIGH, high→MEDIUM, moderate→LOW. **No BLOCKER** —
  escalation needs the runtime-impact judgment only the interactive skill
  applies. Clone groups emit `finding_kind: duplication_group` +
  `extra.instances`; `health_metrics` = `{summary, vital_signs}`.

### Shared runner machinery promoted

With fallow as the second consumer skill, the scanner-agnostic helpers
(parseRunContext, makeFindingId, makeTimestamp, resolveOutputDirectory,
writeArtifacts, ingestIntoCqms, …) moved from `lint-report-shared.mjs` to
**`code-smell-shared/scripts/deterministic-scan-shared.mjs`** —
code-smell-shared is already the cross-skill home for the report contract
these scripts implement. `lint-report-shared.mjs` re-exports them so the
two lint entry scripts keep a single import site; Step 8's app-graph
runner is the intended third consumer.

### Master/detail tables

- **Master `cqms.fallow_runs`** (1:1 via `scan_id` PRIMARY KEY): the wide
  metrics row — tool provenance (version/kind/schema_version/
  analysis_run_id/elapsed_ms), `check_total_issues` + `check_summary`
  jsonb, all `health.summary` scalars, ~20 `vital_signs` scalars +
  `counts`, dupes stats, and profile shapes as jsonb (unit_size/
  interfacing profiles, top_render_fan_in, hotspot_summary,
  target_thresholds, framework_health, entry_points).
  **`health_score/grade/penalties/formula_version` are nullable by
  design** — only standalone `fallow health` runs emit them; the combined
  run this scanner performs does not.
- **Details** (all `ON DELETE CASCADE` from scans, `created_by`+
  `created_at` per ADR-018): `fallow_file_scores` (the per-file analytics
  goldmine), `fallow_hotspots`, `fallow_clone_groups` +
  `fallow_clone_instances` (instances also cascade from their group),
  `fallow_dead_code` (category-discriminated CHECK over
  unused_file|unused_export|unused_type|unused_dependency|
  unlisted_dependency|unresolved_import, auxiliary evidence in `detail`
  jsonb), `fallow_circular_dependencies` (entry_file_path denormalized
  from files[0]), `fallow_large_functions`, `fallow_targets`,
  `fallow_function_findings` (severity keeps **fallow's own
  critical|high|moderate scale**; the canonical mapping lives only in the
  generic layer). `clone_families` are deliberately not stored —
  groupings over the same groups, derivable.
- `sp_ingest_fallow_detail(p_user_id, p_scan_id, p_master, p_detail)` —
  DELETE-then-INSERT; clone groups use the **two-pass WITH ORDINALITY
  pattern** (insert groups RETURNING generated ids keyed by group_index =
  raw array ordinal, then join instances back through the ordinal).

### Extraction pipeline

`ingestScanDetail` gained the fallow branch: loose Zod parse
(`ingestion/fallow/fallowRaw.schema.ts` — whole sections nullish, every
field defaulted) → 9 pure extractors (one per detail table + the master,
each with its own test) → single procedure call with `{master, detail}`
jsonb. Same log-and-continue guarantee as the lint pipeline.

### Verification performed (Step 4)

- Migration 0011 applied to live `cqms_db`; suites green: scan-ingestion
  **116/116** (22 new extractor unit tests + 4 real-DB
  `getScanFallowSummary` tests covering master+detail counts, the clone
  group→instance join, DELETE-then-INSERT idempotency via a real
  procedure call, and the no-master case), scan-orchestrator 9/9 (its
  queue E2E exercises the refactored shared-module import chain through
  the real eslint script). Lint + typecheck clean.
- Standalone script run (`packages/ui` scope): 72 findings (12 MEDIUM /
  60 LOW), 5 duplication_group findings with instances, health_metrics
  populated, raw verbatim (992 file_scores, 5 clone_groups).
- **Live E2E** (real login as admin, real UI trigger-scan on the
  packages/ui project): scan succeeded through the orchestrator's
  deterministic branch. DB probes: master shows fallow 3.0.0 / combined /
  files_analyzed=1533 / files_scored=992 / 22 above threshold / avg
  maintainability 93 / health_score NULL / created_by=system; details:
  992 file_scores (= raw exactly), 56 hotspots, 5 groups + 10 instances
  correctly joined, 42 dead_code rows + 3 cycles (= check_total_issues
  45), 189 large functions, 4 targets, 22 function findings, 72 generic
  findings. Deleting the verification run cascade-removed every row.

---

## Addendum (Step 5): code-smell masters + detail views

**Migration `0012_code_smell_masters.sql`.** The two LLM scanners get
their 1:1 masters so every scanner satisfies the run↔master model;
their "details" are **views**, not tables.

- **Masters `cqms.code_smell_checker_runs` / `cqms.code_smell_zen_runs`**
  (identical shape, 1:1 via `scan_id` PRIMARY KEY): identity from report
  metadata (report*id, generated_at, files_analyzed, top_risk) plus
  rollups **derived from the findings array** — severity counts,
  confidence high/medium/low, effort small/medium/large,
  rules_flagged_count, finding_count. Division of authority:
  `cqms.reports` keeps the tool's own \_claimed* severity counts; the
  master is the _verifiable_ findings rollup, adding the
  confidence/effort dimensions the generic projection doesn't carry.
  **No model/session columns** — the plan sketch assumed report.json
  carried them, but neither the contract nor the agent runner surfaces
  them today; columns get added when the data exists, not before.
- **Details are views** (`code_smell_checker_findings` /
  `code_smell_zen_findings`): scanner-filtered projections of
  `scan_findings` built on the soft-delete-filtering `v_*` views — the
  LLM scanners already emit the canonical shape, so a second table copy
  of the same fact would only drift (run_file_stats precedent, flagged
  in the approved plan).
- `sp_ingest_code_smell_checker_detail` / `sp_ingest_code_smell_zen_detail`
  (`p_user_id`-first, DELETE-then-INSERT) — mirrors the lint pair.

**Dispatcher change**: `ingestScanDetail` now receives the parsed
`report` and is called **unconditionally** by `ingestReport` (previously
gated on `rawJson !== undefined`) — the LLM scanners have no raw
artifact; the raw-based branches (eslint/oxlint/fallow) skip themselves
when `rawJson` is absent. Same log-and-continue guarantee.

### Verification performed (Step 5)

- Migration 0012 applied to live `cqms_db`; scan-ingestion **122/122**
  (2 new extractor unit tests + 4 real-DB `getScanCodeSmellSummary`
  tests: master+view lineup via real `sp_ingest_scan_result` +
  `sp_ingest_code_smell_checker_detail` calls, zen-view scanner-filter
  isolation, DELETE-then-INSERT idempotency, no-master case). Lint +
  typecheck clean.
- **Live E2E through the real CLI** (the exact path every skill's final
  step invokes): crafted checker + zen reports ingested ad hoc against a
  temp git repo — checker master rollups all correct (3 findings → 1
  HIGH/1 MEDIUM/1 NIT, confidence 1/1/1, effort 2 small/1 medium, 2
  distinct rules, created_by=system), zen master written via its own
  procedure, each findings view projects exactly its scanner's rows
  (zero cross-leak), project cascade delete removed both masters.
