# ADR-032: Feed real coverage to the fallow audit gate (DB-free suites only)

**Status:** Accepted
**Amends:** ADR-019 (adds a coverage input to the lint/analysis gate story). Reinstates, with the missing piece, the coverage feed reverted on 2026-07-14 (`dc001c66` → `66b9943e`).

## Context

The `Fallow Audit (new-only gate)` job fails on any newly-introduced finding.
On `feat_cqm` it reported **27 complexity findings — and 22 of them exceeded
`crap` only**, with cyclomatic and cognitive comfortably under their
thresholds (20 / 15).

The cause is not complexity. Fallow scores

```
CRAP = cyclomatic² × (1 − coverage)³ + cyclomatic      (threshold: 30)
```

and, given no coverage data, it **estimates** coverage from whether a
colocated test file exists — `none` → 0%, `partial` → 40% (the file's
_contents_ are irrelevant), `high` → 85%. Solving the formula against
fallow's own reported numbers confirms those tiers exactly.

At an estimated 0%, **any function with cyclomatic ≥ 5 exceeds 30**. So
`login.action.ts` — cyclomatic 5, cognitive 2, about as simple as code gets —
was reported `critical`. The gate was measuring _missing tests_ and calling it
complexity, and it would keep blocking PRs the same way.

A first attempt to fix this by feeding Istanbul data was reverted the same day
it landed: it ran a `test:coverage` task whose `queries/*` suites are
**real-DB integration tests** —
`getPool()` → `readEnvConfig()` throws on the audit job's missing `DB_*`. It
had only ever passed locally, against a running Postgres.

## Decision

### 1. Feed real Istanbul coverage to the audit

`fallow audit --coverage reports/fallow/coverage/coverage-final.json`, wired
into the `fallow-audit` job in `check-safe.yml`. Coverage replaces the guess
with measurement wherever tests actually exist.

### 2. Split the DB-bound suites — coverage must never need a database

This is the piece the reverted attempt lacked, and the reason it can land now.
That workspace's `vite.config.ts` keeps `test` as the full suite (needs
Postgres, so `vp run test:all` is unchanged) and adds `test:unit` /
`test:coverage`, which exclude `src/queries/**` and
`src/ingestion/ingestReport.test.ts` — the only DB-dependent suites. The
remainder (`ingestion/` fallow, appGraph, lint; `auth/`; `fs/`; `cli/`) is
pure: **41 files / 117 tests, no env, no database, ~0.5s**. The audit job
provisions no Postgres.

There is deliberately **no `test:integration`** counterpart. The DB suites are
order- and state-coupled — `listApiTokens` and `failStaleRunningScans` pass
inside the full run but fail when run as a subset, and serializing with
`--no-file-parallelism` does not help. Until that coupling is fixed they are
only trustworthy via the full `test` task.

### 3. One merged report, one shared reporter config

`vp run coverage:merge` (`scripts/merge-coverage.mjs`) runs `test:coverage`
across the DB-free workspaces and merges their reports into
`reports/fallow/coverage/coverage-final.json` — under the canonical
`reports/fallow/` tree, and gitignored by the existing `coverage/` rule since
it is a build product, not a tracked snapshot. Istanbul keys entries by
absolute source path, so entries never collide and a shallow merge is exactly
right. A workspace whose suite fails aborts the merge: a partial report is
worse than none, because the missing files would silently score 0% and fail
the gate on phantom complexity.

The reporter flags live once, in `@repo/vite-configs/run` as
`VITEST_COVERAGE_FLAGS` (v8 provider, `json` reporter — which emits
Istanbul-shaped `coverage-final.json`), so every workspace reports identically.

`@repo/ui` is excluded while its suite is red; `apps/react-router` is excluded
because its findings are baselined (showcase) and its suite is the largest in
the repo. Both are one line to add.

## Consequences

- Complexity findings **27 → 21** (measured; with the `**/*.test.*` `maxCrap`
  override, which is the same insight applied to config: a test file is never
  covered by its own tests, so its CRAP is noise).
- **Real coverage is double-edged, by design.** It removes false positives but
  _exposes_ genuinely untested code the optimistic 40% guess was hiding —
  `extractFallowDeadCode.unresolvedImports` (0% real) now correctly fails. That
  is the gate working, not a regression.
- **`coverage_source: "mixed"` is the expected steady state.** Files with no
  tests at all have nothing to measure and still fall back to the estimate, so
  the findings on untested route actions elsewhere are unchanged by this
  ADR. Coverage cannot fix them; tests or extraction can (the repo's own
  convention: move branchy logic into a colocated tested `.util.ts`, which both
  lowers the caller's cyclomatic and earns real coverage).
- Excluding the DB suites means anything covered _only_ by them reverts to the
  estimate. `ingestScanDetail` is the live example: real coverage scored it
  CRAP 45.2 (a fail), but with the DB suites out it falls back to the
  optimistic 40% tier and passes. The gate is therefore slightly more lenient
  for DB-only-covered code than a full-coverage run would be — accepted, since
  the alternative is provisioning Postgres in the audit job, which is what
  broke last time.
- Triage rule for anyone reading a complexity finding: **read `exceeded`, not
  `severity`.** `crap` alone means untested; `all` / `cognitive` means
  genuinely complex.

## Alternatives rejected

- **Provision Postgres + migrations in the audit job** — heavy, and it races
  a shared job queue (a documented flake). This is what the
  2026-07-14 revert was escaping.
- **Raise `maxCrap`** — would hide real untested complexity everywhere, not
  just where coverage is unmeasurable.
- **Leave the estimator alone and baseline the CRAP findings** — the baseline
  would grow on every PR that adds a function with cyclomatic ≥ 5, i.e. the
  gate would decay into noise.
