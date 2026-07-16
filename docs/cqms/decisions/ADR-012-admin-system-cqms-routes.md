# ADR-012: `admin_system`'s CQMS routes/UI

**Status:** Accepted

## Context

Implementation Plan step 8, per TECH_SPEC §2.8–§2.10: build the five CQMS
routes (project list, new-project, project-detail, run-detail, scan-detail,
trigger-scan) against real rows produced by steps 3–7's schema/ingestion/
agent-runner work, using `packages/ui`'s components. `apps/admin_system`
itself was still the unmodified React Router starter template — none of
steps 1–2's `packages/ui` extraction or Form component had ever actually
been wired into it.

## Decision

### 1. Scaffolding `admin_system` was real, not incidental, work

- `root.tsx`/`entry.server.tsx`/`entry.client.tsx` replaced with the same
  `AppShell`/`AppProviders`/`AppDocument`/`createHandleRequest`/`hydrateApp`
  bundle `apps/react-router` already uses — `entry.server.tsx` in
  particular had been a divergent, less-complete duplicate (no CSP nonce,
  no preload header) since ADR-002 flagged it as this step's job.
- `@repo/ui`/`@repo/data-access`/`@repo/scan-ingestion`/`zod` added as real
  dependencies, with matching `tsconfig.app.json` paths and
  `vite.config.ts` aliases (the shared `createReactRouterPluginsConfig`'s
  StyleX `@repo/ui/*` alias is already app-agnostic — no change needed
  there).
- `/` redirects to `/cqms` — this app has no other feature yet.

### 2. `AppNavigation`'s route list was hardcoded inside `packages/ui` — fixed as part of this step, not deferred

Discovered while wiring `admin_system`'s own nav: `AppNavigation.component.tsx`
imported `getNavigationItems.util.tsx` directly from its own `utils/`
folder, and that file hardcoded `apps/react-router`'s six routes (Home,
Settings, Car Sales, ...). Reusing `AppNavigation` unmodified for CQMS
would have rendered react-router's nav links inside the CQMS app.

**Fix**: `AppNavigation`/`AppShell` both gained a `getNavigationItems:
(iconSize: number) => readonly ToolbarItemConfig[]` prop. The util moved
out of `packages/ui` entirely, to `apps/react-router/src/root/
getNavigationItems.util.tsx` (app-specific content doesn't belong in a
shared package); `admin_system` gets its own copy at
`src/root/getNavigationItems.util.tsx` (currently one item: "Projects" →
`/cqms`). `Root.component.tsx` in both apps now passes its own function
down through `<AppShell getNavigationItems={...} />`. Matches this repo's
own "extend, don't work around" precedent (ADR-002) rather than forking
`AppNavigation`.

### 3. `StaticTable` — a new public `packages/ui` component, extracted mid-step

CQMS has five list views (projects, a project's runs, a run's scans, a
scan's findings, plus `JsonExplorer`'s per-section raw-JSON tables) that
all need the same thing: wire an already-resolved row array into `Table`'s
real sort/filter/pin machinery. This was first built as `JsonExplorer`'s
own private delegate (`JsonExplorerSectionTable`), then promoted to
`packages/ui/src/components/StaticTable/` once the other four routes
turned out to need the identical composition — a genuine "the second/third
consumer proves it's shared" case, not speculative extraction.

`StaticTable` is `TableConfigProvider` + `FiltersDataProvider` + `Table`,
the same stack `TableLayout` uses, **minus** `TableSuspenseBoundary`/
`dataPromise` — see item 4 below for why that distinction matters and why
`StaticTable` ended up used only by `JsonExplorer` in the end, not the
route-level lists.

A second small extraction fell out of building `StaticTable` generically:
`createEmptyColumnsState.util.ts` (`Table/utils/`) builds the
`columnFilters`/`columnSizing`-etc. defaults a `columnsState` needs when
there's no persisted request/cookie state to seed it from — TypeScript
can't verify `{}` satisfies those `Record<DataKey<TData>, ...>` types for
a generic `TData` without an explicit cast, so that cast now lives in one
place instead of at every call site (`StaticTable` and, after item 4's
correction, every CQMS route component using `TableLayout`).

### 4. Loaders stream via unawaited promises — corrected mid-step after a direct user catch

The first pass of every CQMS loader `await`ed its query directly and
handed `StaticTable` a fully-resolved row array. The user flagged this
directly, pointing at `enterprise-orders.loader.ts`'s own convention: list
loaders return the query's promise **unawaited**, and the component
consumes it through `TableLayout`'s `dataPromise` prop (which wraps
`TableSuspenseBoundary` internally) so the route shell streams
immediately instead of blocking on the query.

**Final, corrected pattern, consistent across all four list routes**:

- Single-entity lookups needed for a 404 check or the page header/
  breadcrumb (`project`, `run`, `scan`, `report`) are **awaited directly**
  in the loader — matching `order-detail.loader.ts`'s own precedent, not
  `enterprise-orders.loader.ts`'s (the distinction that matters is
  single-entity-with-a-404-check vs. list-that-can-stream, not
  "CQMS doesn't have a separate paginated API" as first assumed).
- Every **list** (`projects`, a project's `runs`, a run's `scans`, a
  scan's `findings`) is returned as an unawaited `...Promise` and consumed
  via `TableLayout`, not `StaticTable` — `StaticTable`'s real remaining
  job is `JsonExplorer`'s per-section tables, where the promise was
  already resolved one level up (in `scanDetail.loader.ts`, since column
  inference must happen server-side before the component ever sees it).
- The one non-Table async value (`project-detail`'s trend sparklines) uses
  `use(trendPromise)` directly inside a small child component
  (`ProjectTrendPanel`) wrapped in its own `<Suspense>` — the promise
  itself still comes from the loader, never created in render, per
  `use()`'s contract.

### 5. New `packages/scan-ingestion/src/queries/` — the read-query layer TECH_SPEC anticipated but never built

Confirmed via research before writing anything: zero read-query functions
existed anywhere in `scan-ingestion` — `project_run_summary`/
`run_scan_summary`/`project_scanner_trend` were defined in migration SQL
(ADR-006/007) but never queried from TypeScript. Nine new functions, one
per file: `getProjectListView`, `getProjectById`, `getProjectRuns`,
`getProjectScannerTrend`, `getRunById`, `getRunScans`, `getScanById`,
`getScanReport`, `getScanFindings` (paginated + optional severity filter),
plus `getActiveScanners` (backs the trigger-scan form's checklist).

Two new **write** functions, distinct from `ingestReport` (which is for
_completed_ scan results): `registerProject` (reuses `resolveProjectPath`
from the existing ad hoc-ingestion matching logic, so a UI-registered
project and one discovered via an interactive session land on the
identical canonicalized `local_path`) and `triggerScan` (creates a run +
one `queued` scan row per requested scanner — **does not spawn a job**;
actually executing a scan is step 9's background-job orchestrator, and a
triggered run intentionally sits at `queued` until that step exists).

New migration `0005_trigger_scan.sql`: `cqms.fn_create_run_with_scans`
composes the existing `fn_create_run` and bulk-inserts scan rows from a
`jsonb` scanner-id array via `jsonb_array_elements_text` — matching the
established DB-owns-multi-row-writes convention (`sp_ingest_scan_result`)
rather than issuing N individual `INSERT`s from TypeScript.

**Real bug caught by a live query, not inspection**: `project_run_summary`
(ADR-006/007) returned `total_high`/`total_medium` as `bigint`, which
node-postgres surfaces as a JS **string**, not `number` — silently
breaking every consumer expecting a number. Migration `0006` drops and
recreates the view with explicit `::int` casts (a `CREATE OR REPLACE VIEW`
can't change an existing column's output type — Postgres error 42P16 —
so this genuinely needed `DROP`+`CREATE`, safe since nothing else
referenced the view yet).

### 6. `JsonExplorer`'s sections are computed in the loader, never client-side

`buildJsonExplorerSections.util.ts` (`admin_system`-local, since the
shaping is CQMS-specific — different scanners nest their arrays
differently) walks a scan's `raw_json`: one section per top-level
array-of-objects key, unwrapping oxlint's one extra nesting level
(`raw_json.oxlint.diagnostics`), falling back to a "root" section if
`raw_json` itself is such an array. Column inference (`Table/utils/
inferTableColumnsFromJson.util.ts`, confirmed already built by an earlier
step) happens inside this same loader-side function — never in the
component — matching the rule this package's own doc already establishes.

### 7. `resolveRunStatusTone`/`groupTrendByScanner` are CQMS-local, not `packages/ui` additions

`StatusBadge`/`TrendSparkline` (step 8's other new `packages/ui`
components) both deliberately carry no domain opinion on what a status or
trend direction _means_ — same boundary `AppNavigation`'s `getNavigationItems`
draws. Mapping `cqms.runs.status`/`cqms.scans.status` strings to a
`StatusBadgeTone`, and grouping `project_scanner_trend` rows by scanner
into a `TrendSparkline`'s `values` array, are both CQMS-specific and live
in `admin_system/src/routes/cqms/utils/`.

### 8. `admin_system`'s `dev` script needed real env-loading — and hit a genuine `dash` quirk

`admin_system` is CQMS's first `apps/*` project to talk to Postgres
directly (`apps/react-router`/`apps/api-server` never did — TECH_SPEC
decision #4). Its `dev` script (`react-router dev`) had no env-file
loading at all, unlike `packages/scan-ingestion`'s scripts. Two real,
sequentially-discovered bugs, not one:

- `node --env-file-if-exists=... node_modules/@react-router/dev/bin.cjs
dev` (bypassing the `react-router` shell shim to attach `--env-file-if-exists`,
  since that flag isn't allowed via `NODE_OPTIONS`) broke Babel's preset
  resolution — the shim script sets `NODE_PATH` before `exec`-ing node
  against `bin.cjs`; calling `bin.cjs` directly skips that entirely.
- Falling back to sourcing the env files in a plain `sh -c` wrapper instead
  (keeping the real shim intact) hit `dash`'s `.` builtin treating a
  bare `.env` (no `/` in the path) as a `PATH`-searched command name
  rather than a relative file — "not found" even though the file
  demonstrably existed in the cwd. Fixed by referencing it as `./.env`.
  A second, independent bug surfaced once that was fixed: `docker/local/.env`
  has CRLF line endings, and plain `.` sourcing does not strip the
  trailing `\r` from a value — `DB_HOST` was becoming `"localhost\r"`,
  producing a real, correctly-labeled `getaddrinfo ENOTFOUND localhost\r`
  from `pg`. Fixed by piping each env file through `tr -d '\r'` before
  `eval`-ing it, rather than sourcing directly.
- Final script: `sh -c 'set -a; eval "$(tr -d "\r" < ../../docker/local/.env)"; eval "$(tr -d "\r" < ./.env 2>/dev/null)"; set +a; exec react-router dev'`.
  A new `apps/admin_system/.env` (gitignored, matching
  `packages/scan-ingestion/.env`'s own precedent) overrides `DB_NAME`/
  `DB_PASSWORD` to point at the real `cqms_db`/container password.
- **Known, accepted gap**: the production `start` script (from the shared
  `createReactRouterRunConfig`) still has no env-loading — left alone
  since step 9 replaces `@react-router/serve` with a custom Express
  server entirely, which will need its own env wiring built in from
  scratch regardless.

## Consequences

- Every route was verified against **real, live rows** — not fixtures —
  produced by actually calling `registerProject`/`triggerScan`/
  `ingestReport` (the real functions, not raw SQL), then hitting all five
  routes plus both write actions (`new-project`, `trigger-scan`) through a
  real running dev server with `curl`. All returned 200 (302 for the
  actions) with the real seeded content present in the response body. Test
  rows were deleted afterward (cascade via `DELETE FROM cqms.projects`).
- Step 9's background-job orchestrator has an exact contract to fill:
  `triggerScan` already creates the `queued` rows; step 9's job needs to
  pick them up, flip them to `running`, call `runSkillAgent`/the
  deterministic linter script per TECH_SPEC §2.5, then `ingestReport`.
- The `AppNavigation`/`AppShell` prop-injection change and the
  `StaticTable`/`createEmptyColumnsState` extraction both flow back into
  `apps/react-router` (its own `Root.component.tsx` updated, its own
  `AppNavigation.test.tsx` updated to pass a fixture `getNavigationItems`)
  — a real two-way benefit from building CQMS as the second consumer, not
  a one-off.
- WebSocket live-status push (TECH_SPEC §2.7) and the actual job-execution
  wiring remain step 9's work, deliberately not started here.

## Verification performed

`vp fmt --check .`, `vp lint .`, `vp run lint:custom-rules`, `tsc --noEmit`
(via `react-router typegen && tsc`), `vitest run` — all clean, across
`packages/ui` (337 files/1397 tests), `packages/scan-ingestion` (9 files/48
tests, real `cqms_db`, no mocks), `apps/admin_system` (3 files/15 tests),
and `apps/react-router` (unaffected, still 1/1). Live migration runs
(`0005`, `0006`) applied against the real local Postgres instance. Full
manual end-to-end pass: real dev server, real `registerProject`/
`triggerScan`/`ingestReport` calls, all 5 routes + 2 actions confirmed via
`curl` against the actual rendered HTML, then cleaned up.
