---
governs:
  - ui
  - server
---

# ADR-144 — A grid names its table through a `source` setting on the existing loader factory

**Status:** Accepted

- **Date:** 2026-10-27
- **Issue:** #996
- **Relates to:** [ADR-056](./ADR-056-generic-table-route-data-path.md), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md), [ADR-128](./ADR-128-table-page-handlers-take-a-request-and-return-a-response.md), [ADR-141](./ADR-141-declare-the-column-filter-wire-shape-in-the-api-package.md)

## Context

Every piece a grid over one Postgres table needs already existed, spread across
three packages. `@lcabrera/server`'s `createTablePageReader` took the table and
returned its reads; `createTablePageLoader` turned those reads into the handler
of a resource route; `createTableLoaderReads` turned them into the first-page
`fetchPage` the route loader takes. `@lcabrera/ui`'s `createTableRouteLoader`
then needed that `fetchPage`, the schema and table names a second time, and the
three request-shaping capabilities declared by hand on `meta` (ADR-063).
`TableRouteView` needed a `createPaginatedFetcher` from `@lcabrera/api` naming
the resource route's path a third time.

So connecting a grid to a table meant five calls in three places, and three
statements — the table's name, what its endpoint can do, and where it is
mounted — that had to agree with nothing checking them. A capability declared on
`meta` that the reader does not serve sends a request the endpoint misreads; a
fetcher path that is not where the handler is mounted fails on the first scroll.

The two packages cannot meet in the middle by import: `@lcabrera/ui` is
client-safe and may depend only on client-safe packages (ADR-038), so it cannot
call the reader, and `@lcabrera/server` does not depend on `@lcabrera/ui`.

## Decision

**The reader describes its table as a `source`, and the existing loader factory
and route view take that description as a setting.** No new component, wrapper
or loader variant exists for a database-backed grid.

- `createTablePageReader` needs only `primaryKey` and `target` — the schema, the
  table and the column set. The page size, page ceiling, grouped-row ceiling and
  fallback order have defaults (the fallback order is the primary key,
  ascending). An optional `pagePath` names where the resource route is mounted.
- The reader returns two more members. `pageLoader` is the resource route's
  `loader`, the existing `createTablePageLoader` over the reader's own
  `resolvePageRead` and `selectPage`. `source` is plain data plus two functions:
  the first-page `fetchPage` and `resolveGroupingCapabilities` from
  `createTableLoaderReads`, `schemaName`, `tableName`, `pagePath`, and
  `capabilities` — server-side filtering, keyset paging and grouping, the three
  things this reader serves.
- `createTableRouteLoader` takes **either** `fetchPage` and `tableName` (and
  optionally `schemaName` and `resolveGroupingCapabilities`) as before, **or**
  `source`. The type is a union, so passing both is a compile error. A source's
  capabilities are spread under the route's own `meta`, so a route can still
  turn one off; the result still goes through `resolveTableCapabilityMeta`, so
  ADR-063's absent-means-off and cookie-cannot-switch-it-on properties hold. The
  source's `pagePath` lands on `metaState.pagePath`.
- `TableRouteView` and `useTableRoutePage` take `fetchPage` optionally. Without
  it they build a `createPaginatedFetcher` for `metaState.pagePath`, validated by
  `isTablePageResponse`. Without either, there is no `onLoadMore` and the grid
  shows its first page only.

The `source` type is declared twice, structurally: `@lcabrera/ui` declares
`TableRouteSource` for what it accepts, and the reader's return type is what
`@lcabrera/server` produces. The compiler checks the two meet at every call site
that passes one to the other, which is the same arrangement `createTableLoaderReads`
already relied on.

## Consequences

- A grid over one table is three statements: the reader with `pagePath`, a
  resource route whose `loader` is `reader.pageLoader`, and a route loader with
  `source: reader.source`. The table name, the capabilities and the path each
  have one declaration.
- The parse of a page request is the package's: the round trip is
  `buildPaginatedQueryParams` in `@lcabrera/api` out, `parseTablePageParams` in
  `@lcabrera/server` in. An application that keeps its own handler reaches the
  same parse through `parseTablePageParams` and answers a refusal with
  `toRefusedTablePage`, which is now exported for that.
- `createTablePageLoader` and `createTableLoaderReads` now type the reader members
  they need structurally (`TablePageReadResolution`,
  `TableGroupingCapabilities`) instead of through `TablePageReader`, so the reader
  can build on them without a module cycle. The recorded type surface changes,
  not what either accepts.
- **Cost:** the `source` turns all three capabilities on. That is what the reader
  serves, so it is the correct default — but a route that adopted
  `createTableRouteLoader` with no capability meta and now switches to `source`
  starts sending a `filter` and a `cursor` on every load-more. That is the point
  of the change, and it is also a request-shape change the route did not write
  down; `meta` is where it is turned back off.
- **Cost:** a loader typed with a partial of its arguments must now pick an arm
  of the union (`Extract<…, { source?: never }>`), because a `Partial` of the
  whole union admits `source` alongside `fetchPage`.
- A page that is not one table — an external API, a join, a transformed row —
  keeps passing `fetchPage` and its own `TableRouteView` `fetchPage`; nothing
  about that path changed.

## Options considered

1. **A database-backed grid component** that took a schema and table name and
   did the rest. Rejected: it is a second grid, and every Table capability —
   CRUD actions, cell renderers, group details — would have to be threaded
   through it or forked. The grid is one component with settings.
2. **A server-side factory that returns a complete route loader.** Rejected:
   `@lcabrera/server` would have to own the Table's persisted-state reading,
   column decoration and `metaState` assembly, which are `@lcabrera/ui`'s, and
   it may not import that package.
3. **A `source` setting on `createTableRouteLoader`, produced by the reader.
   `Chosen.`** Each package keeps what it owns — the reads in the server, the
   route state in the UI — and the only new surface is a plain description
   handed from one to the other.
4. **Keep five calls and document them.** Rejected: three of the statements must
   agree and nothing checks that they do.

## References

- Issue #996, and its parent #1500
- [ADR-038](./ADR-038-public-package-topology-by-runtime.md) — why the UI package cannot call the reader
- [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) — capabilities live on the loader `meta`
- [ADR-141](./ADR-141-declare-the-column-filter-wire-shape-in-the-api-package.md) — the typed filter wire shape the parse reads
