# Coverage reporting — per-workspace + monorepo

How the CI **Coverage Report** PR comment is produced, which workspaces it
covers, and the phased plan for adding the rest. Companion to
[COMMANDS.md](../../COMMANDS.md) (§4 Gate & CI, §6 What CI runs).

## What the comment shows

On every pull request the `Unit Tests & Coverage` job posts a single, updated
comment: **one row per reported workspace plus an aggregated monorepo total**,
badged per metric (✅ ≥ 80 %, ⚠️ ≥ 60 %, ❌ below).

| Workspace             | Lines | Statements | Functions | Branches |
| --------------------- | ----- | ---------- | --------- | -------- |
| `@repo/ui`            | …     | …          | …         | …        |
| `@repo/server`        | …     | …          | …         | …        |
| `vite-react-compiler` | …     | …          | …         | …        |
| **🏛 Monorepo total**  | …     | …          | …         | …        |

Before this, the comment showed a single unlabelled table — react-router's
totals alone, because `test:ci` runs its coverage last and the comment read that
one `coverage-summary.json`.

## How it works

```
per-workspace test:coverage
   └─ vitest v8 → coverage/coverage-summary.json   (json-summary reporter)
        └─ scripts/coverage-report.mjs
             ├─ reads each reported workspace's .total
             ├─ aggregates a monorepo total (sum covered/total, recompute pct)
             └─ writes coverage/monorepo-coverage-summary.json
                  └─ check-safe.yml "Post coverage summary to PR" → matrix comment
```

Three moving parts:

1. **The shared reporter.** `VITEST_COVERAGE_FLAGS`
   ([`packages/vite-configs/vite.run.shared.config.ts`](../../packages/vite-configs/vite.run.shared.config.ts))
   emits **both** `coverage-final.json` (the `json` reporter, per-statement
   detail) and `coverage-summary.json` (the `json-summary` reporter, totals).
   Every workspace's `test:coverage` inherits it, so coverage is reported
   identically everywhere.
2. **The aggregator.** [`scripts/coverage-report.mjs`](../../scripts/coverage-report.mjs)
   (`vp run coverage:report`) reads each reported workspace's summary, tags it
   with the project name, and computes the monorepo total. Best-effort: a
   workspace whose summary is missing is warned about and skipped, never fatal.
3. **The comment.** The `unit-tests` job runs `coverage:report` after `test:ci`,
   then a `github-script` step renders the matrix (with a fallback to the legacy
   single-table if the aggregate file is absent, so the comment never regresses
   to nothing).

### Why this is separate from `coverage:merge`

They feed different consumers and must not be merged:

| Script            | Feeds                     | Reporter        | Workspaces                                                      | react-router?                                           |
| ----------------- | ------------------------- | --------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| `coverage:merge`  | the **fallow audit gate** | `json` (detail) | the DB-free set — `COVERAGE_WORKSPACES` in `merge-coverage.mjs` | **excluded** (largest suite; fallow findings baselined) |
| `coverage:report` | the **PR comment**        | `json-summary`  | the reported set below                                          | **included** (it is a critical surface)                 |

Coupling them would drag react-router into the fallow merge it is deliberately
kept out of. See [`scripts/merge-coverage.mjs`](../../scripts/merge-coverage.mjs)
for the fallow side.

## Reported workspaces

Defined in `COVERAGE_REPORT_WORKSPACES` in `scripts/coverage-report.mjs`, most-
critical first. These are the public-facing / highest-value surfaces (all four
packages heading for public release — `ui`, `api`, `server`, `utils` — are here;
`apps/react-router` is the showcase app):

| Workspace                 | Package                | `run` | Why                                                                                                                              |
| ------------------------- | ---------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`             | `@repo/ui`             | true  | Runs `test:coverage` here (plain `test` in `test:ci`, no coverage)                                                               |
| `packages/server`         | `@repo/server`         | true  | Same                                                                                                                             |
| `packages/api`            | `@repo/api`            | true  | Same — the browser half of the former `data-access` ([ADR-038](../cqms/decisions/ADR-038-public-package-topology-by-runtime.md)) |
| `apps/react-router`       | `vite-react-compiler`  | false | Its `test:ci` already emits the summary; re-running the repo's largest suite would be wasteful                                   |
| `packages/node-runtime`   | `@repo/node-runtime`   | true  | Phase 2 — DB-free `test:coverage`                                                                                                |
| `packages/scan-ingestion` | `@repo/scan-ingestion` | true  | Phase 2 — DB-free `test:coverage` **subset** (its real-Postgres `queries/*` stay out, so the number is the DB-free portion only) |
| `packages/utils`          | `@repo/utils`          | true  | Phase 2 — pure helpers, own 95% threshold ([#124](https://github.com/luciocabrera/vite-react-compiler/issues/124))               |

`run: false` reuses a summary produced upstream; `--all` forces every workspace
to run (standalone local use, where `test:ci` has not run first).

## Adding a workspace

The soft rule mirrors `coverage:merge`'s opt-in: **a workspace joins the report
only once its coverage runs clean and means something.** Checklist:

1. **It has tests.** A `test`/`test:coverage` task that actually executes source.
   Config-only or typegen-only workspaces (`ts-configs`, `eslint-local-rules`,
   `plugins`, `agent-runner`) have nothing to measure — skip them.
2. **Coverage is external-service-free.** `test:coverage` must not need Postgres,
   a browser beyond jsdom, or a network service — the `unit-tests` job has none.
   A workspace with real-DB tests must expose a DB-free `test:coverage` subset
   first (the `scan-ingestion` / `scan-orchestrator` pattern). This is the exact
   constraint that reverted the first coverage-into-CI attempt (2026-07-14).
3. **It emits `coverage-summary.json`.** Automatic once `test:coverage` uses the
   shared `VITEST_COVERAGE_FLAGS` (all current ones do).
4. **Append it** to `COVERAGE_REPORT_WORKSPACES` with `run: true` (or `false` if
   its summary is already produced upstream). No other change needed — the
   comment scales row-by-row and the total re-aggregates automatically.

### Phased rollout

- **Phase 1 — critical surfaces.** `packages/ui`, `packages/server`,
  `apps/react-router`. ✅ done (PR #32).
- **Phase 2 — remaining library packages.** `packages/node-runtime`,
  `packages/scan-ingestion`, `packages/utils` and `packages/api` (each has a
  DB-free `test:coverage`). ✅ done. `utils` was deferred at first for having no
  test files; it now carries 21 suites and its own 95% threshold (#124), so it
  was admitted alongside the others. `agent-runner`, `plugins`, `ts-configs`,
  `eslint-local-rules` are config/CLI-only with nothing to cover.
- **Phase 3 — apps & server workspaces.** `apps/admin_system` and
  `apps/scan-orchestrator` (both already have DB-free `test:coverage`),
  `apps/shared`; then `apps/api-server` / `apps/api-server-fast` **only after**
  each grows a DB-free `test:coverage` subset (today their suites are real-DB).
  Tracked as GitHub epic
  [#50](https://github.com/luciocabrera/vite-react-compiler/issues/50)
  (children #51–#55, milestone _Coverage rollout — Phase 3_) — the durable-backlog
  layer from [ADR-036](../cqms/decisions/ADR-036-github-planning-layer.md).

Each phase is its own PR, kept reviewable and green before the next.

## Known costs & caveats

- **The package suites run twice in the `unit-tests` job.** `test:ci` runs
  `@repo/ui` / `@repo/server` as plain `test` (the pass/fail gate), then
  `coverage:report` re-runs them as `test:coverage`. This keeps `test:ci`
  untouched and the change purely additive — the same "coverage runs are
  separate from the pass/fail run" split the fallow-audit job already uses.
  **Future optimisation:** a coverage-aware `test:ci` variant that runs the
  reported workspaces with coverage, letting `coverage:report --no-run` just
  aggregate — removing the second run at the cost of coupling `test:ci` to the
  report set.
- **The numbers reflect each suite's executed-file footprint.** v8 measures only
  files a test imports, so denominators differ wildly by suite maturity
  (`@repo/ui` measures ~1244 files, `vite-react-compiler` ~12). Enabling
  `coverage.all` would count untested files too — a truer denominator and lower
  percentages — but that is a per-workspace coverage-quality decision, out of
  scope for the reporting plumbing here.
- **Best-effort, never a gate.** `coverage:report` reports; it does not fail the
  build. `test:ci` is the authoritative test gate; a coverage hiccup degrades the
  comment (partial or fallback), it does not block the PR.
