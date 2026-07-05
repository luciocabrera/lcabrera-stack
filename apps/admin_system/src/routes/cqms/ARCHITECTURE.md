# CQMS Routes Architecture

Implementation Plan step 8 (see ADR-012 for the full decision record;
ADR-013 for the list/new/edit/view CRUD restructure and streaming
corrections applied after review). Routes under `/cqms`, all
reading/writing through `@repo/scan-ingestion/src/queries/` — this app
never talks to `apps/api-server`, per TECH_SPEC decision #4.

## Route Tree

```
route('cqms', 'routes/cqms/layout.ts', [
  index('routes/cqms/cqmsIndex.root.ts'),                          → redirects to /cqms/projects
  route('projects', 'routes/cqms/root.ts'),                        → project list
  route('projects/new', 'routes/cqms/new-project/root.ts'),        → register project (action)
  route('projects/edit/:projectId', 'routes/cqms/edit-project/root.ts'), → rename/re-path project (loader+action)
  route('projects/view/:projectId', 'routes/cqms/project-detail/root.ts'), → runs+trend dashboard
  route('projects/view/:projectId/trigger-scan', 'routes/cqms/trigger-scan/root.ts'), → action
  route('projects/view/:projectId/runs/:runId', 'routes/cqms/run-detail/root.ts'),
  route('projects/view/:projectId/runs/:runId/scans/:scanId', 'routes/cqms/scan-detail/root.ts'),
])
```

`list` / `new` / `edit/:id` / `view/:id` is CQMS's (and this repo's first)
real CRUD convention — see ADR-013. `trigger-scan`/`run-detail`/
`scan-detail` nest under `/view/:projectId/...` as plain sibling routes
(same relationship as before ADR-013, just with `/view/` added to the
path strings) — they are not parent/child layout routes with `view`,
since the view page already fills its own leaf UI rather than acting as
an `Outlet` wrapper.

## Loader Pattern — awaited single entities, streamed lists

Every loader in this tree follows the same split:

- A single-entity lookup needed for a 404 check or page header
  (`project`/`run`/`scan`) is **awaited directly**.
- Every list (`runs`, `scans`, `findings`, the project list itself) is
  returned **unawaited** as a `...Promise` and consumed via `TableLayout`'s
  `dataPromise` prop, which streams the route shell immediately and
  resolves the table in place — matching `enterprise-orders.loader.ts`'s
  own convention, not a CQMS-specific invention.
- Non-Table async values that aren't needed for a 404 check either
  (`project-detail`'s trend sparklines, `scan-detail`'s `report`,
  `trigger-scan`'s `scanners`) read their promise via `use()` inside a
  small child component (`ProjectTrendPanel`, `ScanReportPanel`,
  `TriggerScanForm`), each wrapped in its own `<Suspense>` by the parent —
  per ADR-013, `report`/`scanners` were originally (wrongly) awaited and
  corrected to this shape on review.

## Column-sort/filter state is not persisted

Unlike `enterprise-orders` (which reads persisted state via
`readTableLoaderStateFromRequest` + a `persistenceKey`), every
`TableLayout`/`StaticTable` usage here starts from
`createEmptyColumnsState`'s genuinely empty defaults. These are small,
per-entity list views (one project's runs, one run's scans) — not worth a
cookie round-trip for state that resets naturally on navigation anyway.

## Where the JSON-shaping happens

`scan-detail`'s loader calls `buildJsonExplorerSections` (this app's own
util — the section-splitting heuristic per scanner shape is CQMS-specific)
which in turn calls `packages/ui`'s `inferTableColumnsFromJson` — column
inference always happens server-side, never inside `JsonExplorer` itself.

## Domain mapping stays local

`StatusBadge`/`TrendSparkline` (packages/ui) have no opinion on what a
status or trend direction means. `resolveRunStatusTone.util.ts` and
`groupTrendByScanner.util.ts` (both in `routes/cqms/utils/`) are that
domain-specific mapping — see their own doc comments.

## What step 9 still owns

`trigger-scan`'s action only inserts a `queued` run + scan rows
(`triggerScan.util.ts` in `scan-ingestion`) — it does not execute
anything. The background-job orchestrator that picks up `queued` scans,
runs them (`runSkillAgent` or the deterministic linter script per
TECH_SPEC §2.5), calls `ingestReport`, and pushes live status over
WebSocket is Implementation Plan step 9, not built here.
