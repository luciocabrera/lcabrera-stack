---
'@lcabrera/api': minor
'@lcabrera/ui': minor
---

One generic data path for a paginated table route, replacing three hand-written
copies of it (ADR-056).

**`@lcabrera/api`** gains `createPaginatedFetcher` (`@lcabrera/api/http/create-paginated-fetcher.util`)
and the shared paginated-read contract (`@lcabrera/api/http/http.types`:
`PaginatedSort`, `PaginatedQuery`, `PaginatedFetchArgs`). The factory takes a
path, a required response type guard and an optional base-URL strategy, and
returns a fetcher; it composes the existing `buildPaginatedQueryParams` and
`fetchAndValidate` and adds no HTTP behaviour of its own. The guard is required
because an unvalidated page is a cast, and a wrong cast surfaces as a render
crash several layers from the response that caused it.

**`@lcabrera/ui`** gains the view-side counterpart to `createTableRouteLoader`:

- `TableRouteView` — a whole table route's view. Reads the loader data, wires
  load-more, defaults `dataSelector`/`dataTotalSelector`, renders `TableLayout`.
- `useTableRoutePage` — the same wiring without the JSX, for a route that needs
  its own markup around the table.
- `buildTablePageQuery` and `toKeysetCursorValues`
  (`@lcabrera/ui/routing/shared`) — the client-side mirror of the sort
  composition `createTableRouteLoader` performs server-side.
- `TableRouteLoaderData` (from `createTableRouteLoader.util`) and
  `TablePageResponse` (from the root barrel).

`filter` and keyset `cursor` are **opt-in**, defaulting to off, because they
describe what the endpoint understands. Sending a `cursor` an endpoint ignores
is noise; sending a `filter` it ignores appends unfiltered rows to a filtered
table. Both are declared on the loader `meta` as `isServerFilterEnabled` and
`isKeysetEnabled` (ADR-063) — see the entry for that change in this release.

Additive only — every existing export keeps its signature. One internal
correctness fix rides along: `readTableLoaderStateFromRequest` was casting
`columnOrder`/`columnVisibility` to `keyof TData` where every sibling cast used
the proper state type, so both now use `ColumnOrderState`/`ColumnVisibilityState`.
