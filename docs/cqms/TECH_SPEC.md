# Code Quality Management System (CQMS) — Technical Spec

See also: [PRD.md](./PRD.md), [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md), ADRs in [decisions/](./decisions/).

## 2.1 Terminology recap

**Project** (registered repo) → **Run** (one scan session, aggregates N scans) → **Scan** (one scanner's execution within a run) → **Finding** (one structured record inside a scan) → **Report** (the rendered Markdown handoff doc per scan).

## 2.2 Schema design decision (resolves "how many JSON shapes / detail tables" question)

**One canonical `scan_findings` table**, not 2–3 separate shape-specific tables. Every scanner's individual findings (linter errors, code-smell findings, fallow's per-category items) map into one shape matching the already-existing `SCHEMA_V1.md` finding contract (`finding_id, rule_id, severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, status, owner, tags`), plus an `extra JSONB` overflow column for scanner-specific fields that don't fit (e.g. a fallow duplicate-group's list of instances). A `finding_kind` discriminator (`single_location` | `duplication_group`) tells consumers when `location_path` is representative rather than singular.

Separately, `scans.raw_json` stores the **complete, untouched original artifact** (full `fallow.raw.json`, full linter output, full code-smell JSON) — this is what "copy raw JSON" and the JSON-table exploration (§2.9) read from, and it's the fallback for anything the generic finding shape can't represent (fallow's `health.vital_signs`/hotspots aggregate metrics aren't per-finding items, so they live here, not as `scan_findings` rows).

**Why not split further**: every real consumer (severity counts, prioritized queue, search/filter, trend aggregation) needs to query "findings for a scan" uniformly. Splitting by scanner family would force a `UNION` or two code paths for a difference (`location` vs `locations[]`) that `extra` already absorbs. If a genuine relational need shows up later (e.g. "files in >3 clone groups"), an additive `scan_duplication_instances` table is a clean, non-breaking migration — not designed now.

**Note on `fallow-code-checker`**: `SCHEMA_V1.md` already lists all three current skills (`code-smell-checker`, `code-smell-zen`, `fallow-code-checker`) under one shared contract — confirmed by reading the file directly. So requirement "update code-smell-checker/zen to emit JSON" is extended to **all three** existing skills for symmetry. The new linter skill is the 4th, and every scanner uses one ingestion path — not three-plus-a-special-case.

## 2.3 DDL (`packages/scan-ingestion/src/db/migrations/0001_init_cqms.sql`)

All primary keys are `uuid DEFAULT gen_random_uuid()` (PostgreSQL 13+ has `gen_random_uuid()` built in — no `pgcrypto` extension needed; confirmed the local `docker/local` Postgres is recent enough). `scanners.scanner_id` stays `text` — it's a natural key (`'fallow'`, `'linter'`, ...), not a surrogate.

```sql
CREATE TABLE projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  local_path       text NOT NULL UNIQUE,   -- realpath-canonicalized; the ad hoc matching key
  default_branch   text NOT NULL DEFAULT 'main',
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_scanned_at  timestamptz
);

-- Reference table (not a CHECK enum) so adding a 5th scanner is a data insert, not a migration.
CREATE TABLE scanners (
  scanner_id           text PRIMARY KEY,      -- 'fallow' | 'linter' | 'code-smell-checker' | 'code-smell-zen'
  display_name         text NOT NULL,
  skill_path           text NOT NULL,          -- '.github/skills/fallow-code-checker'
  deterministic        boolean NOT NULL,       -- see §2.5: true only when finding-generation needs zero LLM judgment
  supports_diff_scope  boolean NOT NULL DEFAULT false,
  is_active            boolean NOT NULL DEFAULT true
);

CREATE TABLE runs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  origin              text NOT NULL CHECK (origin IN ('ui_agent_sdk','interactive_session','ci')),
  triggered_by        text,       -- user/session identifier, nullable
  status              text NOT NULL DEFAULT 'queued'
                       CHECK (status IN ('queued','running','succeeded','failed','partially_failed','canceled')),
  requested_scanners  jsonb NOT NULL DEFAULT '[]'::jsonb,
  git_commit_sha      text,
  git_branch          text,
  started_at          timestamptz,
  finished_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE runs ADD CONSTRAINT runs_id_project_unique UNIQUE (id, project_id);
CREATE INDEX runs_project_created_idx ON runs (project_id, created_at DESC);

CREATE TABLE scans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             uuid NOT NULL,
  project_id         uuid NOT NULL,
  scanner_id         text NOT NULL REFERENCES scanners(scanner_id),
  status             text NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','running','succeeded','failed','canceled')),
  scope_type         text NOT NULL CHECK (scope_type IN ('repo','folder','changed-files','diff')),
  scope_value        text NOT NULL,
  base_branch        text,
  head_branch        text,
  commit_range       text,
  started_at         timestamptz,
  finished_at        timestamptz,
  duration_ms        integer,
  progress_message   text,
  error_message      text,
  raw_json           jsonb,      -- complete untouched artifact; feeds "copy raw JSON" + the JSON-table explorer (§2.9)
  raw_artifact_path  text,
  health_metrics     jsonb,      -- free-form aggregate metrics (fallow vital_signs/hotspots), no shared contract
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scans_run_project_fk FOREIGN KEY (run_id, project_id) REFERENCES runs(id, project_id) ON DELETE CASCADE
);
CREATE INDEX scans_run_idx ON scans (run_id);
CREATE INDEX scans_project_scanner_created_idx ON scans (project_id, scanner_id, created_at DESC);

CREATE TABLE reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id           uuid NOT NULL UNIQUE REFERENCES scans(id) ON DELETE CASCADE,
  schema_version    text NOT NULL DEFAULT '1.0',
  report_id         text NOT NULL,
  generated_at      timestamptz NOT NULL,
  report_markdown   text NOT NULL,
  report_json       jsonb NOT NULL,
  files_analyzed    integer NOT NULL DEFAULT 0,
  blocker_count     integer NOT NULL DEFAULT 0,
  high_count        integer NOT NULL DEFAULT 0,
  medium_count      integer NOT NULL DEFAULT 0,
  low_count         integer NOT NULL DEFAULT 0,
  nit_count         integer NOT NULL DEFAULT 0,
  top_risk          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
-- Severity counts are flattened out of report_json into real columns because
-- the trend view and runs table need to sort/filter/aggregate across many
-- rows; report_json stays the verbatim render source, these are a projection.

CREATE TABLE scan_findings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id              uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  finding_id           text NOT NULL,
  rule_id              text NOT NULL,
  severity             text NOT NULL CHECK (severity IN ('BLOCKER','HIGH','MEDIUM','LOW','NIT')),
  confidence           text NOT NULL CHECK (confidence IN ('high','medium','low')),
  location_path        text NOT NULL,
  location_hint        text,
  evidence_excerpt     text,
  why                  text NOT NULL,
  fix                  text NOT NULL,
  effort               text CHECK (effort IN ('small','medium','large')),
  defer_risk           text,
  verification_steps   jsonb NOT NULL DEFAULT '[]'::jsonb,
  status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','done','deferred')),
  owner                text,
  dependencies         jsonb,
  related_findings     jsonb,
  tags                 jsonb,
  finding_kind         text NOT NULL DEFAULT 'single_location' CHECK (finding_kind IN ('single_location','duplication_group')),
  extra                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scan_id, finding_id)
);
CREATE INDEX scan_findings_scan_idx ON scan_findings (scan_id);
CREATE INDEX scan_findings_scan_severity_idx ON scan_findings (scan_id, severity);
CREATE INDEX scan_findings_location_idx ON scan_findings (location_path);

-- Per-file inventory for the run's project snapshot. Only populated for
-- whole-project scopes (repo/folder); empty for diff-only runs
-- (code-smell-zen alone). Deliberately captures nested_level now (path depth
-- from project root) so Phase 2's dependency graph has the raw material it
-- needs — "a type nested deep in one folder but used across many unrelated
-- areas" (the stated Phase 2 motivation) requires exactly this column.
-- NOTE: there is deliberately no separate run_file_stats TABLE — the
-- category rollup is a VIEW over this table (§2.3a), not a second
-- app-maintained copy of the same fact.
CREATE TABLE run_files (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  file_path          text NOT NULL,   -- project-relative
  file_type_category text NOT NULL,  -- suffix-convention category: component, hook, util, service_api, repository, controller, route, types, stylex, constants, schema, test, other
  extension          text NOT NULL,  -- raw extension, e.g. '.tsx', '.ts' — distinct from category
  nested_level       integer NOT NULL, -- directory depth from project root
  line_count         integer,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, file_path)
);
CREATE INDEX run_files_run_idx ON run_files (run_id);
CREATE INDEX run_files_run_category_idx ON run_files (run_id, file_type_category);
```

## 2.3a Postgres functions, procedures, and views — the DB owns CRUD/rollup logic, not the TS layer

Per explicit direction: CRUD and "heavy" multi-table logic live in the database as functions/procedures/views, so `admin_system`'s loaders/actions and `scan-ingestion`'s TS layer stay thin (validate input, call one DB object, shape the response) rather than hand-assembling multi-statement writes or repeating rollup joins in application code. Still raw SQL, no ORM — this is organizing where the SQL lives, not introducing one. It also tightens the existing "dynamic SQL identifiers must be allowlisted" security rule: parameters bind as typed function/procedure arguments (`uuid`, `text`, `jsonb`), not string-composed queries built fresh per call site.

**Functions** (`packages/scan-ingestion/src/db/migrations/0002_functions.sql`):

```sql
-- Match-or-create a project by canonicalized local_path. Backs both the CLI's
-- ad hoc interactive-session path and the UI's new-project action.
CREATE FUNCTION fn_upsert_project(p_name text, p_local_path text)
RETURNS uuid AS $$
  INSERT INTO projects (name, local_path)
  VALUES (p_name, p_local_path)
  ON CONFLICT (local_path) DO UPDATE SET last_scanned_at = now()
  RETURNING id;
$$ LANGUAGE sql;

-- Creates a run row; used by both the UI trigger-scan action and the CLI's
-- auto-create-a-run-for-one-ad-hoc-scan path.
CREATE FUNCTION fn_create_run(
  p_project_id uuid, p_origin text, p_requested_scanners jsonb,
  p_triggered_by text, p_git_commit_sha text, p_git_branch text
) RETURNS uuid AS $$
  INSERT INTO runs (project_id, origin, requested_scanners, triggered_by, git_commit_sha, git_branch, status, started_at)
  VALUES (p_project_id, p_origin, p_requested_scanners, p_triggered_by, p_git_commit_sha, p_git_branch, 'running', now())
  RETURNING id;
$$ LANGUAGE sql;

-- Rolls sibling scans' statuses up into the parent run once all
-- requested_scanners have reached a terminal state.
CREATE FUNCTION fn_finalize_run_status(p_run_id uuid) RETURNS void AS $$
  UPDATE runs SET
    status = CASE
      WHEN NOT EXISTS (SELECT 1 FROM scans WHERE run_id = p_run_id AND status NOT IN ('succeeded','failed','canceled'))
        THEN (CASE
          WHEN EXISTS (SELECT 1 FROM scans WHERE run_id = p_run_id AND status = 'failed')
           AND EXISTS (SELECT 1 FROM scans WHERE run_id = p_run_id AND status = 'succeeded') THEN 'partially_failed'
          WHEN EXISTS (SELECT 1 FROM scans WHERE run_id = p_run_id AND status = 'failed') THEN 'failed'
          ELSE 'succeeded' END)
      ELSE 'running'
    END,
    finished_at = CASE WHEN NOT EXISTS (SELECT 1 FROM scans WHERE run_id = p_run_id AND status NOT IN ('succeeded','failed','canceled')) THEN now() ELSE finished_at END,
    updated_at = now()
  WHERE id = p_run_id;
$$ LANGUAGE sql;
```

**Procedure** (bulk write, one transaction, called once per ingested scan):

```sql
-- Bulk-inserts findings and (for whole-project scopes) file inventory via
-- jsonb_to_recordset, rather than N individual parameterized INSERTs issued
-- from TypeScript. p_findings / p_file_inventory are JSON arrays matching
-- scan_findings / run_files' shapes (minus generated columns).
CREATE PROCEDURE sp_ingest_scan_result(
  p_scan_id uuid, p_run_id uuid, p_report_markdown text, p_report_json jsonb,
  p_report_metadata jsonb, -- { report_id, generated_at, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk }
  p_findings jsonb,        -- readonly ScanFindingInput[]
  p_file_inventory jsonb   -- readonly RunFileInput[] | null (null for diff-scope scans)
) LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO reports (scan_id, report_id, generated_at, report_markdown, report_json, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk)
  SELECT p_scan_id, r.report_id, r.generated_at, p_report_markdown, p_report_json,
         r.files_analyzed, r.blocker_count, r.high_count, r.medium_count, r.low_count, r.nit_count, r.top_risk
  FROM jsonb_to_record(p_report_metadata) AS r(
    report_id text, generated_at timestamptz, files_analyzed integer,
    blocker_count integer, high_count integer, medium_count integer,
    low_count integer, nit_count integer, top_risk text
  );

  INSERT INTO scan_findings (scan_id, finding_id, rule_id, severity, confidence, location_path, location_hint, evidence_excerpt, why, fix, effort, defer_risk, verification_steps, tags, finding_kind, extra)
  SELECT p_scan_id, f.* FROM jsonb_to_recordset(p_findings) AS f(
    finding_id text, rule_id text, severity text, confidence text, location_path text, location_hint text,
    evidence_excerpt text, why text, fix text, effort text, defer_risk text, verification_steps jsonb,
    tags jsonb, finding_kind text, extra jsonb
  );

  IF p_file_inventory IS NOT NULL THEN
    INSERT INTO run_files (run_id, file_path, file_type_category, extension, nested_level, line_count)
    SELECT p_run_id, f.* FROM jsonb_to_recordset(p_file_inventory) AS f(
      file_path text, file_type_category text, extension text, nested_level integer, line_count integer
    )
    ON CONFLICT (run_id, file_path) DO NOTHING;
  END IF;

  UPDATE scans SET status = 'succeeded', finished_at = now(), duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000
  WHERE id = p_scan_id;

  PERFORM fn_finalize_run_status(p_run_id);
END;
$$;
```

(A failed scan has no report/findings to ingest — that path is a direct `UPDATE scans SET status = 'failed', error_message = ...` followed by `PERFORM fn_finalize_run_status(run_id)`, called straight from the TS orchestrator rather than through this procedure.)

**Views** (`.../migrations/0003_views.sql`):

```sql
-- Replaces the separate run_file_stats table from earlier drafts of this
-- design — one source of truth (run_files), the category rollup is just a
-- query shape, not an app-maintained second copy of the same fact.
CREATE VIEW run_file_stats AS
  SELECT run_id, file_type_category, count(*) AS file_count, sum(line_count) AS total_lines
  FROM run_files GROUP BY run_id, file_type_category;

-- Backs cqms/root.ts: each project joined to its latest run + that run's
-- rolled-up severity counts, via a LATERAL join instead of a loader-side
-- N+1 or a hand-assembled aggregate query.
CREATE VIEW project_run_summary AS
  SELECT p.*, lr.run_id AS latest_run_id, lr.status AS latest_run_status, lr.total_high, lr.total_medium
  FROM projects p
  LEFT JOIN LATERAL (
    SELECT r.id AS run_id, r.status,
           sum(rep.high_count) AS total_high, sum(rep.medium_count) AS total_medium
    FROM runs r JOIN reports rep ON rep.scan_id IN (SELECT id FROM scans WHERE run_id = r.id)
    WHERE r.project_id = p.id
    GROUP BY r.id ORDER BY r.created_at DESC LIMIT 1
  ) lr ON true;

-- Backs run-detail's Table and the WebSocket status payload.
CREATE VIEW run_scan_summary AS
  SELECT s.run_id, s.id AS scan_id, s.scanner_id, s.status, s.progress_message, s.duration_ms,
         rep.blocker_count, rep.high_count, rep.medium_count, rep.low_count, rep.nit_count
  FROM scans s LEFT JOIN reports rep ON rep.scan_id = s.id;

-- Backs the trend view's up/down indicator — run-over-run deltas computed
-- in SQL via a window function, not fetched-then-diffed in the loader.
CREATE VIEW project_scanner_trend AS
  SELECT r.project_id, s.scanner_id, r.id AS run_id, r.created_at,
         rep.high_count, rep.medium_count,
         rep.high_count - lag(rep.high_count) OVER w AS high_count_delta,
         rep.medium_count - lag(rep.medium_count) OVER w AS medium_count_delta
  FROM runs r JOIN scans s ON s.run_id = r.id JOIN reports rep ON rep.scan_id = s.id
  WINDOW w AS (PARTITION BY r.project_id, s.scanner_id ORDER BY r.created_at);
```

**Consequence for the TS layer**: `ingestReport()` in `packages/scan-ingestion` becomes a thin validate-then-call wrapper — a **thin** Zod pre-check on `report.json` (top-level shape only: `findings` is an array, required top-level keys present — not a field-by-field mirror of every DB constraint), then `SELECT fn_upsert_project(...)`, `SELECT fn_create_run(...)` (ad hoc path only), and `CALL sp_ingest_scan_result(...)` — no hand-assembled multi-INSERT transaction logic in TypeScript. Loaders in `admin_system` become thin reads against the views above (`SELECT * FROM project_run_summary WHERE ...`) instead of hand-written joins repeated per route.

**Why Zod stays at the HTTP boundary but shrinks here, reasoned from capability, not convention**: Postgres's `NOT NULL`/`CHECK` constraints are the real authority on a finding's per-field validity (`severity IN (...)`, required text fields) — duplicating that as a full Zod schema would mean maintaining the same rules in two places. But at the loader/action boundary (`new-project`, `trigger-scan`), Postgres structurally cannot replace Zod: it can't check the filesystem (`localPath` existence is a Node-only check), it can't give TypeScript a typed value from `request.formData()`'s `unknown` without some parse step, and it only reports the first constraint violation per statement — repeatedly round-tripping to discover each invalid form field one at a time would be a real UX regression for the `Form` component's instant-feedback design. Zod isn't a new dependency either way — it's already used throughout this monorepo.

**Future dependency-graph placeholder** (Phase 2 — confirmed additive, no conflict): `symbols(id uuid, project_id, file_path, symbol_name, symbol_kind, exported, run_id)` and `symbol_references(id uuid, project_id, from_symbol_id, to_symbol_id, reference_kind)`, both keyed off `projects`/`runs` that already exist. Tooling recommendation for that phase: `ts-morph` for AST-accurate symbol/import extraction (over `madge`/`dependency-cruiser`, which are graph-level only and don't give per-symbol export/usage granularity).

## 2.4 Shared ingestion path — `packages/scan-ingestion` (new, `@repo/scan-ingestion`)

Single function, two callers — this is what satisfies "not two divergent code paths":

```typescript
type IngestReportArgs = {
  readonly scannerId:
    | 'fallow'
    | 'linter'
    | 'code-smell-checker'
    | 'code-smell-zen';
  readonly origin: 'ui_agent_sdk' | 'interactive_session' | 'ci';
  readonly localPath: string;
  readonly reportMarkdownPath: string;
  readonly reportJsonPath: string;
  readonly rawJsonPath?: string;
  readonly scopeType: 'repo' | 'folder' | 'changed-files' | 'diff';
  readonly scopeValue: string;
  readonly runId?: string; // uuid. UI path: attach to an existing run. Ad hoc path: omit, one is created.
  readonly triggeredBy?: string;
};

type IngestReportResult = {
  readonly projectId: string;
  readonly runId: string;
  readonly scanId: string;
  readonly reportId: string;
  readonly findingsIngested: number;
};

export const ingestReport = async (
  args: IngestReportArgs,
): Promise<IngestReportResult> => {
  /* ... */
};
```

- **Skill script caller**: each of the 4 skills' final step invokes a thin CLI wrapper (`node .../cli/ingest.cli.ts --skill=fallow --run-dir="$OUTPUT_DIR" --local-path="$(git rev-parse --show-toplevel)"`), which reads files off disk and calls `ingestReport`. Requires adding this exact invocation to `.claude/settings.json`'s `permissions.allow` list (same pattern already used for `run-fallow.sh`/`collect-diff.sh`) and to each skill's `allowed-tools:` frontmatter.
- **UI job caller**: `admin_system`'s background job imports `ingestReport` directly from `@repo/scan-ingestion` (`workspace:*`), no subprocess — it already has the files on disk from whichever execution path produced them (Agent SDK session, or — for the linter — a plain deterministic script; see §2.5).
- **Project/run matching for ad hoc interactive runs** (no pre-existing `run_id`): resolve `local_path` via `git rev-parse --show-toplevel`, upsert `projects` on the `local_path` unique constraint, auto-create a single-scan `run` (`origin = 'interactive_session'`). Known accepted limitation: two checkouts of the same repo become two distinct `projects` rows — consistent with the "local paths only" decision; a future `vcs_remote_url` column can de-duplicate later without a breaking change.
- **This package owns 100% of CQMS's database access — confirming decision #4.** No route or job ever reaches `apps/api-server`; `admin_system`'s loaders/actions call into `@repo/scan-ingestion` (or a sibling read-query module in the same package) directly. DB access layer follows the sister-project convention: `getPool.util.ts` (singleton `Pool`), `getClient.util.ts`, `query.util.ts` (`{ text, params }` args, `finally { client.release() }`), Zod-validated env schema. Migrations are plain numbered `.sql` files with a minimal tracking table — no ORM, per the locked decision.
- **`ingestReport()` is a thin validate-then-call wrapper, not an orchestration layer** — per §2.3a, the multi-table write (scan, report, findings, file inventory, run-status rollup) happens inside `sp_ingest_scan_result` on the DB side. The TS function's job is: Zod-parse `report.json` off disk into the shapes the procedure expects, then call `fn_upsert_project`/`fn_create_run` (ad hoc path only) and `CALL sp_ingest_scan_result(...)`. `classifyFileTypeCategory.util.ts` (suffix → category) and `nested_level` computation still happen in TS while walking `localPath` (that's filesystem work, not a DB concern) — the resulting file list is passed as one `jsonb` array into the procedure, which bulk-inserts it.

## 2.5 Linter skill design (oxlint + eslint) — the one fully-deterministic scanner

Verified directly (not assumed) by running both tools against `apps/admin_system` in this repo.

**Confirmed: no overlap between the two tools.** `vp lint` (oxlint, via `createReactRouterLintConfig`) covers the bulk stock/plugin rule set. The separate `eslint . --config eslint.config.mjs` pass runs `createCustomRulesLintConfig`, scoped **only** to `@repo/eslint-local-rules` custom rules oxlint can't express. They check disjoint rule sets — no dedup/reconciliation logic is needed between them.

**Real raw shapes** (sampled via `vp lint apps/admin_system --format json` and `eslint . --format json`):

- oxlint: `{"diagnostics": [{"message", "code": "plugin(rule-name)", "severity": "error"|"warning", "filename", "labels": [{"span": {"line","column","offset","length"}}], "help", "url", "causes", "related"}], "number_of_files", "number_of_rules", ...}`
- eslint: `[{"filePath", "messages": [{"ruleId", "severity": 1|2, "line", "column", "endLine", "endColumn", "message", "fix"?}], "errorCount", "warningCount", "fixableErrorCount", ...}]`

**Combined raw artifact** (`linter.raw.json`), mirroring fallow's own `"kind": "combined"` convention:

```json
{ "kind": "combined", "oxlint": { "diagnostics": [...], "number_of_files": 0, ... }, "eslint": [ ... ] }
```

**Key design decision — this scanner needs no LLM judgment at all.** A lint violation already carries an unambiguous rule, location, and human-readable message/fix hint straight from the tool. So:

- A deterministic script (`scripts/generate-linter-report.mjs`) maps every oxlint diagnostic and eslint message directly into the canonical `scan_findings` shape — **this becomes `report.json` directly, with no LLM step**:
  - `rule_id` = `diagnostic.code` (oxlint) / `message.ruleId` (eslint)
  - `severity`: oxlint `"error"`/`"warning"` and eslint `2`/`1` both map to `HIGH`/`MEDIUM` (fixed two-tier table; documented Phase-1 simplification — no BLOCKER/LOW/NIT nuance is derivable mechanically)
  - `confidence`: always `"high"` — mechanical tools have no ambiguity
  - `location_path`/`location_hint`: `filename`/`labels[0].span.line:column` (oxlint) or `filePath`/`line:column` (eslint), paths relativized to the project root
  - `why`/`fix`: oxlint's `message`/`help` map directly; eslint only has one `message` string, so `fix` falls back to `"Address per rule: ${ruleId}."` — a known, acceptable gap versus oxlint's richer output
  - `effort`: defaulted to `"small"` (lint fixes are overwhelmingly small; not mechanically distinguishable further in Phase 1)
  - `tags`: the rule's plugin prefix (`import`, `react`, `eslint`, etc.)
  - `extra`: `{ source: 'oxlint'|'eslint', url, causes, fixable }`
  - `finding_id`: a stable hash of `(rule_id, location_path, location_hint)` — same violation in an unchanged file produces the same id across runs.
- `report.md` is **templated, not authored** — Summary/top_risk/first_3_actions/Prioritized Queue are all mechanically computable: severity counts are a `GROUP BY`, `top_risk` names the most-frequent rule_id, the Prioritized Queue groups findings **by rule_id** (one queue item per rule, `target_finding_ids` = every instance) rather than one item per instance.

**Consequence for `scanners.deterministic`**: the linter is the one scanner where `deterministic = true` means finding-generation truly needs zero LLM involvement — so **UI-triggered linter runs skip the Agent SDK entirely**, running the deterministic script directly (plain child process), then calling `ingestReport()`. `fallow` stays hybrid (its triage step is genuine judgment); `code-smell-checker`/`code-smell-zen` stay 100% Agent SDK. The background job's execution branch is simply: `scanner.deterministic ? runDeterministicScript() : runSkillAgent()`.

The skill itself (`.github/skills/linter-checker/SKILL.md` + `scripts/generate-linter-report.mjs`) still exists as a normal Claude Code skill for the interactive-session case (mirroring `fallow-code-checker`'s directory shape), but its prose is much thinner — mostly "run the script, it produces all three artifacts unattended, report the saved paths."

## 2.6 Agent SDK invocation — `packages/agent-runner` (new, `@repo/agent-runner`)

Applies to `fallow` (triage step only), `code-smell-checker`, `code-smell-zen` — not `linter` (§2.5).

Kept as a **separate package** from `scan-ingestion` — `agent-runner`'s job stops at "produce report.md/report.json/raw files on disk, return their paths"; ingestion is a distinct step the caller performs after. This keeps `scan-ingestion` free of any Anthropic SDK dependency.

```typescript
type RunSkillAgentArgs = {
  readonly scannerId: ScannerId;
  readonly skillPath: string; // '.github/skills/<dir>' inside the CQMS repo itself
  readonly targetProjectPath: string; // absolute, canonicalized — the project being scanned
  readonly scopeArgument?: string;
  readonly outputDirectory: string;
  readonly onProgress?: (message: string) => void; // → scans.progress_message + WebSocket push (§2.7)
};

export const runSkillAgent = async (
  args: RunSkillAgentArgs,
): Promise<RunSkillAgentResult> => {
  /* ... */
};
```

Loads the real `SKILL.md` (frontmatter parsed by reusing the logic already in `scripts/validate-skills.cjs`, not reimplementing it), runs an actual Agent SDK session with `cwd = targetProjectPath` and a tool allowlist derived from the skill's own `allowed-tools:` line, streams progress via `onProgress`, then verifies the expected output files exist.

**Security — the highest-risk part of this spec:**

- Tool allowlists (`Bash(cat:*)` etc.) are prompt/policy-level, not an OS sandbox. This is implicitly acceptable today because a human watches interactive runs; it is **not** acceptable once fully unattended.
- **Recommendation, treat as required**: run the Agent SDK session in a **child process** under OS-level restrictions scoped to `targetProjectPath` + `outputDirectory` only. The "in-process background execution" decision covers _where the job lifecycle lives_ — it does not mean the untrusted-repo-scanning agent session shares the parent process's full filesystem access.
- `targetProjectPath` must always be validated against the `projects.local_path` table — never accept an arbitrary path from a request at execution time.
- Exclude `.env*` from readable scope as defense in depth, and never let a scan target resolve to the CQMS's own repo/credentials.
- `admin_system` needs its own Zod-validated `ANTHROPIC_API_KEY`, never logged, never returned in loader data.
- **Small required deviation, flagged explicitly**: each of the 3 Agent-SDK-driven skills' script needs to honor an optional pre-set `OUTPUT_DIR` (falling back to today's self-generated timestamped path for the unmodified interactive case) — otherwise a UI-triggered scan of another project would write CQMS scratch files into that project's own working tree.

## 2.7 Real-time status — WebSockets (not polling)

Per explicit follow-up decision, run/scan status pushes to the UI in real time over a WebSocket rather than the UI polling an interval. This is a real infrastructure change, not a drop-in swap.

**Why this is better than polling here, not just different**: a polling loop needs a `useEffect` to drive the timer, which is an awkward fit for "zero `useEffect` for server data" — it's fetching, just on a schedule instead of on mount. A WebSocket _subscription_ is a canonical, accepted `useEffect` use case (synchronizing with an external system), so this change actually removes a guideline exception rather than introducing one.

**Server — replaces the stock `@react-router/serve` binary.** `apps/admin_system`'s production `start` script currently runs `@react-router/serve`, which doesn't expose the underlying `http.Server` needed to attach a WebSocket upgrade handler. New `apps/admin_system/server.ts`: an Express app using `@react-router/express`'s `createRequestHandler` (the official first-party adapter) for all normal React Router traffic, wrapped in `http.createServer(app)` so a `ws` `WebSocketServer` can attach to that same server (`new WebSocketServer({ server: httpServer, path: '/ws/runs' })`). The WS upgrade is handled before a request ever reaches React Router's router — it is not a `routes.ts` entry.

Chose plain `ws` over `socket.io`: this is a single-process, low-traffic internal tool with one narrow fan-out need (broadcast to clients watching one `run_id`); a small in-memory map covers it without pulling in socket.io's heavier abstraction (rooms, namespaces, transport fallbacks) for a need this small.

**Dev-mode caveat, flagged explicitly as real work, not an afterthought**: `apps/admin_system`'s `dev` script runs `react-router dev` (a Vite dev server), which owns its own `http.Server`, separate from the production `server.ts` above. Getting WebSockets working in dev requires a small Vite plugin using the `configureServer(server)` hook to attach the same `WebSocketServer` logic to Vite's `server.httpServer` — a different code path than production, conceptually the same operation. This dual dev/prod wiring is its own implementation task.

**Hub**: `runStatusHub.util.ts`, living in `admin_system` — **not** in `packages/scan-ingestion`, which stays framework-agnostic (Postgres + Zod only, importable by the CLI/skills, no WebSocket concept). An in-memory `Map<runId, Set<WebSocket>>`; on connect a client sends `{ type: 'subscribe', runId }` (validated as a real uuid, no further auth — internal tool), and `publish(runId, payload)` fans a JSON message out to every socket subscribed to that run. `admin_system`'s background-job orchestrator (which already calls `ingestReport()` and writes status transitions) calls `runStatusHub.publish(...)` immediately after each state change — ingestion and status-push stay two separate, composable side effects of the job orchestrator, not baked into the DB layer.

**Client**: `useRunStatusSocket.hook.ts` opens a WebSocket to `/ws/runs/:runId` inside a `useEffect` (see the guideline-fit note above). On message, it calls `useRevalidator().revalidate()` rather than trusting the WS payload as UI state directly — **the socket is a cache-invalidation signal, not a data channel**; the loader stays the single source of truth for data shape, so there's no second data contract to keep in sync with the loader's. Includes basic reconnect-with-backoff on disconnect; no polling fallback in Phase 1 — accepted risk (a socket that can't reconnect needs a manual page refresh).

## 2.8 API surface — `apps/admin_system/src/routes/cqms/`

Mirrors the `enterprise-orders` bundle pattern (`layout.ts` / `root.ts` / `*.loader.ts` / `*.meta.ts` / `*.errorBoundary.tsx` / `*.component.tsx` / `*.constants.tsx`):

```
route('cqms', 'routes/cqms/layout.ts', [
  index('routes/cqms/root.ts'),                                            // project list / dashboard
  route('projects/new', 'routes/cqms/new-project.route.ts'),               // action-only
  route('projects/:projectId', 'routes/cqms/project-detail/root.ts'),      // runs table + trend
  route('projects/:projectId/runs/:runId', 'routes/cqms/run-detail/root.ts'),
  route('projects/:projectId/runs/:runId/scans/:scanId', 'routes/cqms/scan-detail/root.ts'),
  route('projects/:projectId/trigger-scan', 'routes/cqms/trigger-scan.route.ts'), // action-only
]),
```

(No `run-status` polling route — live status is the WebSocket path in §2.7, handled outside the router entirely.)

All `:projectId`/`:runId`/`:scanId` params are uuids — loaders/actions must Zod-validate them as such (`z.string().uuid()`), not parse as `Number(...)` the way `order-detail.loader.ts` does for its integer `:orderId`.

| Route                    | Loader                                                                                                                                                                                                                      | Action                                                                                                                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cqms/root.ts`           | Projects joined to latest run + severity counts — rendered via `Table`                                                                                                                                                      | —                                                                                                                                                                                                                                                                    |
| `new-project.route.ts`   | —                                                                                                                                                                                                                           | Built with the new `Form` component (§2.10) — Zod-validates `{name, localPath}`, verifies path exists server-side, inserts `projects` row                                                                                                                            |
| `project-detail/root.ts` | Project + paginated runs `Table` (mirrors `readTableLoaderStateFromRequest` pattern) + trend series                                                                                                                         | —                                                                                                                                                                                                                                                                    |
| `run-detail/root.ts`     | Run + a `Table` listing that run's scans (one row per scanner: status badge, severity counts, duration, row action → scan-detail); page also opens `useRunStatusSocket`                                                     | —                                                                                                                                                                                                                                                                    |
| `scan-detail/root.ts`    | Report (markdown + json + counts) + paginated/filterable findings `Table` + raw JSON pre-shaped into `JsonExplorer` sections via `inferTableColumnsFromJson.util.ts` (computed here, in the loader — §2.9, not client-side) | —                                                                                                                                                                                                                                                                    |
| `trigger-scan.route.ts`  | —                                                                                                                                                                                                                           | Built with the new `Form` component (§2.10) — Zod-validates chosen scanners, inserts `runs`+`scans` rows (`queued`), spawns background job (branches per §2.5 on `scanners.deterministic`), redirects to run-detail — the app's first genuine domain-mutation action |

Every list surface in this feature — projects, runs, scans-within-a-run, findings, and raw-JSON exploration — goes through the same shared `Table` component, per the explicit requirement to keep list views consistent.

## 2.9 UI components, and the JSON-as-table requirement

**Principle: extend, don't work around.** The `packages/ui` extraction (Implementation step 1) must budget time for this, not treat `Table`/`Card`/`SidePanel` as frozen imports.

**Known required `Table` extension — dynamic, runtime-inferred columns.** Today's only real usage (`enterprise-orders`) gives `Table` a compile-time-fixed `COLUMNS[]` from `*.constants.tsx`. CQMS needs the opposite: `scans.raw_json` is a different, unpredictable shape per scanner (fallow's `check.unused_files[]` vs. `dupes.clone_groups[]` vs. linter's `oxlint.diagnostics[]` vs. code-smell's finding arrays) — columns can't be hand-authored per scanner ahead of time. Design:

- **New util** `inferTableColumnsFromJson.util.ts` (`packages/scan-ingestion` or a shared location both it and `packages/ui` can import): given any `readonly Record<string, unknown>[]`, computes column defs from the union of keys across all rows — column type inferred per key (`string | number | boolean | date-like | object | array`), primitives rendered directly, nested object/array cells rendered as a compact inline JSON string with a click-to-expand.
- **This computation happens in the `scan-detail` loader, not the client.** The loader calls `inferTableColumnsFromJson.util.ts` against the relevant sections of `scans.raw_json` server-side and returns already-shaped data — `{ sections: readonly { label: string; columns: InferredColumn[]; rows: readonly Record<string, unknown>[] }[] }` — as loader data. `JsonExplorer` (packages/ui) is a **presentational** component: given that pre-shaped `sections` data, it renders section-picking (a `Tabs` strip) and, per section, a `Table` fed the already-computed columns. It does not walk or infer columns from raw JSON client-side.
- This is genuinely new `Table` capability (runtime column definitions, not just runtime _data_) — flagged explicitly as work required in Implementation step 1, since it changes `Table`'s public API (an optional `columns` **generator** input, alongside today's static `columns` prop).

**Other new components, in `packages/ui`** (none of these exist anywhere in the monorepo today): `StatusBadge` (generalize the existing `Tag` component with a `tone` prop if its API allows), `CopyButton` (used both for raw JSON text and individual cell values), `MarkdownRenderer` (new dependency: `react-markdown`, sanitized before SSR even though content is LLM-authored not user input), `TrendSparkline` (hand-rolled SVG, no chart library — consistent with StyleX-only styling).

**Migrated into `packages/ui`**: `Table` (+ the runtime-columns extension above) + its loader-state utils (`readTableLoaderStateFromRequest.util.ts`, `sanitizeSorting.util.ts` — currently under `apps/react-router/src/routes/utils/`, must move with `Table`), `Card`, `SidePanel`, `Icons`, `RouteErrorBoundary`, design tokens, `Tabs`, `Toolbar`/`AppNavigation`/`NavLink`/`Modal`.

**Stay local to `admin_system`**: CQMS nav shell, `TriggerScanForm.component.tsx`, `FindingDetailPanel.component.tsx` (SidePanel + JsonExplorer + StatusBadge), `useRunStatusSocket.hook.ts`, and route-specific `*.constants.tsx` static column definitions.

## 2.10 Generic `Form` component — parallel `packages/ui` addition

Requested as a companion to `Table`: the same "the component knows how to render itself from declarative config" philosophy (`columns` for `Table`, `fields` for `Form`). Studied against an existing reference implementation at `control-business-ui-ts/src/components/Form` (a different, unrelated project) before designing this — not copied verbatim, since several of its conventions (styled-components, hand-rolled validation rules, loosely-typed `accessor: string`, hardcoded switch dispatch, submission fully disconnected from routing) don't fit this monorepo's rules.

**Built on React Router 7's native `<Form>`, not a disconnected callback.** The reference project's `Form` calls a plain `onAccept(data)` callback with zero routing involvement. Ours instead wraps RR7's `<Form method="post" action={...}>` (or `useFetcher().Form` for non-navigating submissions, e.g. a modal trigger-scan form) — every leaf field renders a real native input named after its `accessor`, so submission is genuine `FormData` flowing into a Zod-validated action, exactly the loaders/actions-only data flow `routes-data.md` already mandates. Client-side field validation is a progressive-enhancement layer for instant feedback only; the action's Zod parse remains authoritative, and server-side errors surface per-field via `useActionData()` matched by `accessor`.

**Field config — a real discriminated union, not the reference's overloaded `type: string`:**

```typescript
type FieldOption = { readonly value: string; readonly label: string };

// Elicitation-shaped: label/description/options mirror MCP's requestedSchema
// (title, description, enum, required) — the combined pattern of
// table-column ergonomics and elicitation-style schema fields. accessor is
// keyof TValues, unlike the reference project's plain string, so the fields
// config is compile-time linked to the value type.
type BaseFieldDef<TValues> = {
  readonly accessor: keyof TValues & string;
  readonly label: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly clientValidation?: {
    readonly required?: boolean;
    readonly pattern?: string;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly min?: number;
    readonly max?: number;
    readonly message?: string;
  }; // hand-rolled, no Zod import client-side — Zod stays server-only, see §2.3a
};

type TextFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'text' | 'email' | 'password' | 'textarea';
};
type NumberFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'number';
};
type BooleanFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'boolean';
  readonly variant?: 'checkbox' | 'toggle';
};
type SelectFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'select';
  readonly options: readonly FieldOption[];
  readonly mode?: 'single' | 'multi';
};
type RadioFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'radio';
  readonly options: readonly FieldOption[];
};
type DateFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'date' | 'datetime';
};
type CustomFieldDef<TValues> = BaseFieldDef<TValues> & {
  readonly type: 'custom';
  readonly renderField: (args: RenderFieldArgs<TValues>) => ReactNode;
}; // kept from the reference — a genuinely useful escape hatch

type LeafFieldDef<TValues> =
  | TextFieldDef<TValues>
  | NumberFieldDef<TValues>
  | BooleanFieldDef<TValues>
  | SelectFieldDef<TValues>
  | RadioFieldDef<TValues>
  | DateFieldDef<TValues>
  | CustomFieldDef<TValues>;
```

**`Form` must be as agnostic to where `fields` came from as `Table` is about `columns`.** `Table` doesn't care whether its `columns` were hand-authored at compile time or computed at runtime by `inferTableColumnsFromJson.util.ts` inside a loader — it just renders whatever `columns` it's given. `Form` must have the identical property for `fields`: `Form.component.tsx` takes a `fields: readonly FieldNode<TValues>[]` prop and renders purely from that, with zero knowledge of whether that array was hand-written (CQMS's two forms) or generated dynamically (e.g. a future form whose `fields` are derived server-side from an elicitation-style JSON schema). Whenever `fields` genuinely needs to be computed, that computation happens **server-side, in a loader** — never client-side, the same rule §2.9 establishes for `Table`'s runtime columns.

**Leaf renderers reuse the existing design system — verified by reading the actual component prop types, not assumed:**

- `boolean` → `Checkbox` (`variant: 'checkbox'`, the default) or `ToggleSwitch` (`variant: 'toggle'`) — both already exist with exactly the needed props (`isChecked`/`isDisabled`/`onChange`), no new component needed.
- `select` → `VirtualSelect` (`mode: 'single' | 'multi'`, `options`, `selected`, `onChange`) — the established design-system select control, not a bare native `<select>`.
- `radio` → `RadioOptionGroup` (`name`/`options`/`value`/`onChange`) — added as its own leaf type specifically because this component already exists and fits it exactly.
- `text`/`number`/`date` → no existing bare (non-filter) input component was found — Table's `TextFilterInput`/`NumberFilterInput`/`DateFilterInput` exist, but are coupled to the filter-operator system and aren't reusable as-is. Investigate at implementation time whether their underlying native-input rendering can be extracted into a shared "bare input" primitive both they and `Form` build on, rather than building fully disconnected new components.
- `custom` → unrestricted escape hatch, as in the reference project.

**React 19 / React Router 7 alignment** (illustrative field-config shape above, not a literal implementation contract):

- Submission follows this codebase's already-established action-submission idiom — `useFetcher()` (the same pattern `usePersistCookieAction.hook.ts` already uses), not a new bespoke mechanism.
- Pending/busy state uses React 19's `useFormStatus()` inside the submit button and disabled-field logic, avoiding manually threading `fetcher.state` down through every leaf field.
- No manual `useMemo`/`useCallback` around field renderers or the field registry — per ADR-004, the React Compiler owns memoization.
- `accessor: keyof TValues & string` and the action's input type should align with React Router 7's generated route types once real routes exist.

**Recursive grouping — `row` | `tab` | `group`:**

```typescript
type GroupFieldNode<TValues> = {
  readonly type: 'group';
  readonly label?: string;
  readonly fields: readonly FieldNode<TValues>[];
};
type RowFieldNode<TValues> = {
  readonly type: 'row';
  readonly fields: readonly FieldNode<TValues>[];
};
type TabFieldNode<TValues> = {
  readonly type: 'tab';
  readonly tabs: readonly {
    readonly label: string;
    readonly fields: readonly FieldNode<TValues>[];
  }[];
}; // reuses the migrated Tabs component

type FieldNode<TValues> =
  | LeafFieldDef<TValues>
  | GroupFieldNode<TValues>
  | RowFieldNode<TValues>
  | TabFieldNode<TValues>;
```

**Field-type dispatch via a registry, not a hardcoded switch.** The reference project's field dispatcher is a `switch (field.type)` with only `text`/`select` ever actually implemented, despite an unused enum suggesting broader intent — `fieldRegistry: Record<LeafFieldDef<TValues>['type'], FieldRenderer<TValues>>` makes adding a field type a registry entry, not a growing switch.

**State — reuse, don't rebuild.** The reference project hand-rolled its own store for controlled field values. This monorepo already has the exact same primitive, confirmed by reading it directly: `apps/react-router/src/hooks/useStore.hook.ts` — `TStore<TData>` (`get`/`set`/`subscribe`/`reset`/`getServerSnapshot`), shallow-equality-gated, SSR-safe. Every `Table` context already builds on this hook, and it _is_ the mandated "Context + `useSyncExternalStore`" pattern. `Form` reuses this hook directly — it needs to move to `packages/ui` alongside `Table`. Each field subscribes with a selector so only the field whose value changed re-renders.

**Composition** (mirrors `Table`'s file-bundle conventions): `Form.component.tsx` (root) → `FormFields.component.tsx` (the recursive interpreter for `group`/`row`/`tab`/leaf — a single walker, reused by a shared `flattenFields.util.ts` that both `getInitialValues.util.ts` and `validateFields.util.ts` call, deliberately centralized — avoiding a real bug-surface in the reference project, where three files independently re-implement the same recursion) → `FormField.component.tsx` (registry dispatch) → leaf components, each wrapping a shared `FormFieldChrome.component.tsx` for label/description/error.

**CQMS as first consumer**: `cqms/new-project.route.ts`'s and `cqms/trigger-scan.route.ts`'s forms are built with this component rather than hand-written JSX — the first two real, dogfooding consumers.

**No new dependency.** Built entirely on RR7's native `<Form>`/`useFetcher`, the existing `useStore.hook.ts` primitive, and Zod (server-side only) — genuinely first-party.

## 2.11 New dependencies to add to the pnpm `catalog`

`@anthropic-ai/claude-agent-sdk` (agent-runner, used for 3 of 4 scanners), `react-markdown` (packages/ui), `ws` + `@types/ws` (admin_system's custom server), `@react-router/express` (admin_system, replacing `@react-router/serve`). The linter skill and the new `Form` component need no new runtime dependency. No UUID-generation library needed client/server-side — Postgres generates them; TypeScript types are just `string`.

## 2.12 Coding-guideline compliance

Confirmed against `AGENTS.md`, `.claude/rules/{typescript,react-components,routes-data,testing}.md` (read in full): `type` not `interface`, all-readonly, `Args`-suffixed multi-param functions, mandatory file suffixes, StyleX-only styling, `use()` not `useContext()`, loaders/actions only for server data (the WebSocket subscription in §2.7 is a legitimate `useEffect` use case, not an exception to this rule), Zod validation on all loader/action inputs and env vars (kept strictly server-side; `Form`'s client-side `clientValidation` hints are a deliberately separate, hand-rolled, non-Zod definition), raw parameterized SQL with allowlisted identifiers, ADR required for the `packages/ui` extraction (including the `Table` runtime-columns extension and the new `Form` component) and the new custom server entry, `INVENTORY.md` updated for every new shared component, `useStore.hook.ts` reused rather than re-implemented.

## 2.13 Remaining flagged items

1. The three Agent-SDK-driven skills gain one line of `OUTPUT_DIR` conditional logic to support being invoked against a different repo than the one they live in (§2.6) — a small, necessary deviation from "reuse the real SKILL.md untouched."
2. The dev-mode WebSocket wiring (§2.7's Vite plugin) is a distinct piece of real work from the production server, not a footnote — budget for it explicitly rather than discovering it late.
3. `Form`'s scope is deliberately Phase-1-sized (`text`/`number`/`boolean`/`select`/`date`/`custom` leaf types) — richer types the reference project only aspired to (`tags`, `json`, `password-checker`) are registry additions later, not blockers now.
