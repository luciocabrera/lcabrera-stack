# Planned: Biome as a CQMS scanner

**Status:** deferred, spec-complete. Approved to build (owner said "build it now,
full ADR-019 shape"), then parked before implementation. This file is the
resumption spec — it exists so the work can be executed without re-deriving any
of it. Delete it once the scanner ships.

**Why deferred, not dropped:** Biome already does its _gate_ job — CI step,
`check:safe`, pre-commit hook, `reports/biome/full-latest.json`. What is missing
is _observability_: Biome findings never reach the CQMS database, so there is no
historical trend, no per-rule / per-file analytics, no workspace attribution, and
Biome is absent from findings reconciliation (ADR-024/025). For a linter adopted
this cycle, the burn-down trend is exactly the data you would want — which is the
argument for doing this, not a reason it is urgent.

**Read first:** [ADR-019](decisions/ADR-019-lint-split-and-master-detail-extraction.md)
(the eslint/oxlint scanner split this mirrors) and
[ADR-035](decisions/ADR-035-biome-third-linter.md) §"Not a third CQMS scanner".

---

## The one thing that will bite you

`scannerIdSchema` (`packages/scan-ingestion/src/ingestion/report.schema.ts`) is a
**kebab-case regex, not an enum** — so `'biome'` already passes report
validation. But `cqms.lint_violations.source` has a **closed CHECK constraint**:

```sql
source varchar(32) NOT NULL CHECK (source IN ('eslint','oxlint'))
```

So a half-finished integration will validate and ingest, then fail at the CHECK
constraint **at INSERT time in production**, not at build time. The migration
that widens this CHECK is therefore step 1 and is not optional — do not ship any
other piece without it.

---

## Verified facts (checked 2026-07-17 — re-confirm if stale)

**Biome's JSON diagnostic** (`biome lint . --reporter=json`) is lean. Top-level
is `{ summary, diagnostics, command }`; each diagnostic is:

```jsonc
{
  "severity": "error" | "warning" | "info",
  "message": "Template literals are preferred over string concatenation.",
  "category": "lint/style/useTemplate",   // this is the rule_id
  "location": { "path": "<repo-relative>", "start": {line,column}, "end": {line,column} },
  "advices": []                            // ALWAYS empty in JSON output
}
```

Consequences for the schema, all confirmed against real output:

- **No fixability field in JSON.** The text reporter prints `FIXABLE`; the JSON
  does not carry it. → `fixable` is always `false`. (Do not try to recover it;
  it is not there.)
- **No help URL.** → `help_url` is always null/omitted.
- **`advices` is always `[]`** in `--reporter=json`. Nothing to extract from it.
- **`category` is the rule id** (e.g. `lint/style/useTemplate`), analogous to
  oxlint's `code`.
- **Three severities**: `error`, `warning`, `info`. `lint_violations.severity` is
  the 5-value canonical enum `BLOCKER|HIGH|MEDIUM|LOW|NIT`. Map
  **error→HIGH, warning→MEDIUM, info→LOW**. (oxlint only ever produced HIGH/MEDIUM
  because it lacks an info level; Biome's `info` is why LOW finally gets used —
  note that `LintViolationInput.severity` is currently typed `'HIGH' | 'MEDIUM'`
  and must widen to include `'LOW'`.)
- Location is `location.start.{line,column}` / `location.end.{line,column}`.

**Next migration number:** `0029` (highest present is `0028_api_tokens.sql`).
Re-check before writing — others may have landed.

**Postgres** runs locally on port 5434 (`vp run db:status`); verify the migration
against it, not just by reading SQL.

---

## The build, mirroring the oxlint scanner exactly

The oxlint scanner is the closest template (Biome, like oxlint, has no
suppression concept — unlike eslint's `suppressedMessages`). Every file below has
an oxlint counterpart to copy from.

### 1. Migration `packages/scan-ingestion/src/db/migrations/0029_biome_scanner.sql`

- **Widen the CHECK** (the biting thing above):
  `ALTER TABLE cqms.lint_violations DROP CONSTRAINT <name>, ADD CONSTRAINT ... CHECK (source IN ('eslint','oxlint','biome'))`.
  Find the real constraint name first (`\d cqms.lint_violations`); the inline
  `CHECK` in `0010` gets an auto-generated name like `lint_violations_source_check`.
- **Scanner row**: `INSERT INTO cqms.scanners (...) VALUES ('biome', 'Biome',
'.github/skills/linter-checker', true, false, true) ON CONFLICT DO NOTHING` —
  copy the shape from `0010_lint_split.sql:13`.
- **Master table** `cqms.biome_runs` (1:1 via `scan_id` PK), columns:
  `files_analyzed`, `error_count`, `warning_count`, `info_count`,
  `rules_violated_count` (distinct categories), `created_by`, `created_at`.
  Model on `cqms.oxlint_runs` (`0010:70`). Add `cqms.v_biome_runs` view (ADR-018
  read-view rule).
- **Ingest procedure** `cqms.sp_ingest_biome_detail(p_user_id, p_scan_id,
p_master, p_violations)`: copy `sp_ingest_oxlint_detail` (`0010:137`) verbatim,
  swap `oxlint_runs`→`biome_runs`, the master column list, and the detail
  `DELETE ... WHERE source = 'biome'`. **Footgun (already documented in
  0010):** `jsonb_to_recordset` never applies column DEFAULTs, so every NOT NULL
  column must be emitted explicitly by the extractor.
- `cqms.lint_file_stats` and `cqms.v_lint_violations` are already source-agnostic
  — they pick up `'biome'` rows for free once the CHECK allows them. No change.

### 2. Extractors — `packages/scan-ingestion/src/ingestion/lint/`

Copy the three oxlint files and adapt:

- `biomeRaw.schema.ts` ← `oxlintRaw.schema.ts`. Zod-parse `{ summary:{errors,
warnings,infos,...}, diagnostics:[{severity,message,category,location{path,
start,end}}] }`, everything `.default()`ed so version drift degrades to partial
  extraction (ADR-019).
- `extractBiomeViolations.util.ts` ← `extractOxlintViolations.util.ts`. Map each
  diagnostic to a `LintViolationInput` with `source:'biome'`, `rule_id:category`,
  `severity_raw:severity`, `severity:` the error/warning/info→HIGH/MEDIUM/LOW map,
  `fixable:false`, `line/col` from `location.start`, `end_line/end_col` from
  `location.end`. Reuse `makeFindingId` and `makeGitRootRelative`. Biome's
  `location.path` is already repo-relative, so the path handling is simpler than
  oxlint's (no `scopeValue` resolution needed — confirm against a target-mode run).
- `extractBiomeRunSummary.util.ts` ← `extractOxlintRunSummary.util.ts`. Pull
  counts from `summary` (`errors`/`warnings`/`infos`), count distinct `category`
  for `rules_violated_count`.
- **Widen `lintViolation.types.ts`**: `source` union → add `'biome'`; `severity`
  union → add `'LOW'`.
- Colocated `.util.test.ts` for each extractor (the oxlint ones are the pattern —
  a fixture raw object in, asserted rows out).

### 3. Dispatch — `packages/scan-ingestion/src/ingestion/ingestScanDetail.ts`

Add a `scannerId === 'biome'` branch mirroring the `'oxlint'` branch (`:96`):
parse with `biomeRaw.schema`, extract master + violations, `CALL
cqms.sp_ingest_biome_detail($1,$2,$3,$4)`. Add the three imports.

### 4. Runner — `.github/skills/linter-checker/scripts/generate-biome-report.mjs`

Copy `generate-oxlint-report.mjs`. It runs `biome lint . --reporter=json` (root),
maps diagnostics into the canonical `scan_findings` shape, writes
`biome.raw.json` + `report.json` + `report.md`, and `ingestIntoCqms({scannerId:
'biome'})`. Shared machinery (`buildReport`, `writeArtifacts`, `parseRunContext`,
etc.) is already in `lint-report-shared.mjs` — no new helpers needed. There is no
`biome`-config-detection concern for legacy mode (root-only pass), but check the
target-mode branch: Biome needs a `biome.json`/`biome.jsonc` in the target, so add
a `BIOME_CONFIG_NAMES` guard like `OXLINT_CONFIG_NAMES`.

### 5. Skill — `.github/skills/linter-checker/SKILL.md`

Add the Biome scanner to the "run BOTH scripts" section (now three), and to the
description. It currently says oxlint + eslint.

### 6. ADR — amend `ADR-035`

Change the "Not a third CQMS scanner (yet)" consequence to record that it now IS
one, following the ADR-019 "Addendum (Step N)" convention. Note the CHECK-widening
migration and the error/warning/info→HIGH/MEDIUM/LOW mapping as the two decisions
worth recording.

---

## Verification (do all — a passing build is not proof of correct ingest)

- Migration applies cleanly against the live DB (5434) and `\d cqms.biome_runs` /
  the widened CHECK are present.
- Run `generate-biome-report.mjs` against this repo, then query
  `cqms.v_lint_violations WHERE source='biome'` and `cqms.v_biome_runs` — row
  counts match `reports/biome/full-latest.json`'s summary.
- Re-run the same scan; row counts are unchanged (DELETE-then-INSERT idempotency).
- Extractor unit tests pass; `test:unit` for `@repo/scan-ingestion` stays DB-free
  (extractors are pure — the DB-bound part is the procedure, exercised separately).
- Full gate green: `vp check`, `typecheck:all`, all three linters, `test:ci`, and
  `vp run commands:verify` (SKILL.md and any new script must not break doc checks).

## Rough size

~1 migration, ~4 source files + 2 tests, 1 dispatch branch, 1 runner, 2 doc
edits. Half a day. The only genuinely new thinking is the JSON→columns mapping,
which this file has already done.
