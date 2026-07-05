# StaticTable Architecture

Wires an already-resolved, non-paginated row array into the real `Table`
sort/filter/pin machinery. Extracted from `JsonExplorer` (which originally
built this wiring as a private delegate) once CQMS's other list routes —
projects, a project's runs, a run's scans, a scan's findings
(Implementation Plan step 8) — turned out to need the exact same
composition, all fed by a loader that queries Postgres directly and already
has the full row set in hand before rendering.

## Public API

- `StaticTable<TData>` — `columns: readonly TableColumn<TData>[]`,
  `rows: readonly TData[]`, `title?: string`.

## Why not `TableLayout`?

`TableLayout` (`Table/TableLayout/`) is built for the "paginated remote
data" case: it takes a `dataPromise` and wraps `TableSuspenseBoundary` so
the route can stream in while more pages load via `onLoadMore`. CQMS's
loaders don't have a separate paginated API to call — they query Postgres
directly in the loader and already have every row before the component
ever renders. Forcing that through a `dataPromise`/Suspense boundary would
add a layer with nothing to suspend on. `StaticTable` is the same
`TableConfigProvider` + `FiltersDataProvider` + `Table` composition
`TableLayout` uses, just without `TableSuspenseBoundary`.

## Column-sort/filter state is not persisted

`columnsState`'s `columnOrder`/`columnPinning`/`columnSizing`/
`columnVisibility`/`sorting` all start at their empty defaults on every
render, unlike `EnterpriseOrders`' own loader (which reads persisted state
via `readTableLoaderStateFromRequest`). CQMS's list views are small,
ephemeral (a findings table for one scan, a runs table for one project) —
not worth a `persistenceKey`/cookie round-trip for state that resets
naturally each time you navigate to a different project/run/scan anyway.

## File Structure

- `StaticTable.component.tsx` — the provider composition + `Table` render
- `StaticTable.types.ts` — `StaticTableProps`
- `StaticTable.test.tsx` — real integration render (same stack requirement as `JsonExplorer`'s own test — see its ARCHITECTURE.md)
- `index.ts` — barrel: component + type

## Consumers

CQMS's `root` (project list), `project-detail` (runs), `run-detail`
(scans), and `scan-detail` (findings) routes, plus `JsonExplorer` itself
(Implementation Plan step 8).
