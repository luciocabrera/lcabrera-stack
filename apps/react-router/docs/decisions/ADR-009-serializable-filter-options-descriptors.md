# ADR-009: Serializable Filter-Options Fetch Descriptors (Tool-Call Pattern)

**Status:** Accepted

## Context

Table columns carried three function members — `fetchFilterOptions`,
`filterOptionsDataSelector`, `filterOptionsDataTotalSelector` — that told the
filter drawer how to load a column's option list. Functions cannot cross the
React Router loader boundary: single-fetch turbo-stream encoding silently
replaces them with `undefined` on the client (`SingleFetchFallback` — no
error, no warning). Routes worked around this by returning `columnsState`
without `columns` and re-attaching a module constant client-side.

That workaround breaks the roadmap: a pgAdmin-like feature will build columns
**dynamically from the database** (schema → table → `information_schema`
columns). Runtime-built columns have no module constant to re-attach, so the
fetch logic itself must be serializable.

## Decision

Replace the function members with a **serializable JSON descriptor** on
`TableColumn` — a structured "tool call" the client interprets, analogous to
AI tool execution: the server bakes the arguments, the client owns the tool
implementations.

```ts
// TableColumn.filterOptionsDescriptor
| { kind: 'static'; values: readonly string[] }
| { kind: 'distinct';
    transport: 'bff' | 'loader';
    params: { schemaName?: string; tableName: string; columnName: string } }
```

- **Server (loader) side** — `appendDistinctFilterDescriptors`
  (`@repo/ui/routing`) decorates every filterable string column that has no
  descriptor with a `distinct` descriptor (`columnName` = `column.key`;
  schema/table from route config; transport from app choice).
  `createStaticFilterOptions` emits `static` descriptors for build-time enum
  lists. Loaders return `columns` inside `columnsState` again — everything is
  data.
- **Client tool** — `resolveFilterOptionsDescriptor`
  (`packages/ui/src/utils/filters/`) dispatches on `kind` to an executor that
  produces the `{ onLoadMore, dataSelector, dataTotalSelector }` contract the
  existing `useFetchFilterData` chain consumes. Nothing below
  `SelectFilterInput` changed — pagination (`skip`→`offset`), the
  `hasMore ? Infinity : length` total convention, and the ADR-006 prefetch
  cache all still apply. All fetching stays client-side at filter-open /
  scroll time; loader row-streaming is untouched.
- **Transports** — `bff` targets the API server's generic
  `GET /api/distinct?schemaName&tableName&columnName&limit&offset`; `loader`
  targets the same-origin resource route `GET /_api/filter-options` whose loader
  reads Postgres **directly, server-side** via `@lcabrera/server`'s
  `selectFilterOptions` helper (an app-owned `.server` distinct service — no
  external API round-trip, the same self-sufficient model the row loaders use).
  All three demo routes use `loader` (enterprise-orders moved off `bff` in #340):
  `bff` fetches the API host directly from the browser, which only works behind a
  proxy (dev Vite, or a prod reverse proxy) **and** needs the external API running,
  so it fails under a bare `react-router-serve` prod build — whereas `loader`
  works in every environment with the app alone. `bff` remains a supported
  transport, still unit-covered in `packages/ui` (`getFilterOptionsBaseUrl`,
  `resolveDistinctFilterOptions`, `appendDistinctFilterDescriptors`), for
  genuinely cross-origin API deployments that configure CORS. The `.server`
  service holds **no allow-list of its own**: it derives both the allow-list and
  each column's `ColumnType` from the per-entity `config/*DISTINCT_FILTER_COLUMNS`
  maps (declared once per entity, alongside its schema/table), rather than
  importing the API's own domain layer — an undeclared cross-app edge (ADR-039).
  `selectFilterOptions` is deliberately **thin over the generic** query layer:
  the builders/executors (`buildSelectQuery`/`selectRows` with `distinct: true`,
  exposed as `buildDistinctQuery`/`selectDistinctRows`) stay generic over a list
  of columns, and the dropdown specialization — one column, `IS NOT NULL`, empty
  dropped only for `text` (`ColumnType`), ordered + paginated, mapped to
  `{ values, hasMore }` — lives only in the helper, composed from generic
  `filters` (a new `isNotNull` operator) rather than a bespoke predicate. A
  **unified per-entity column-metadata source** — one declaration driving UI
  columns, filter style, allow-list, and column type, plus value+label
  projection — is the tracked next step.
- **Layering** — generic mechanisms live in `@repo/data-access`
  (`buildDistinctQuery` in the query builder; `fetchDistinctValues` +
  response guard on the api side); domain config lives on the API side
  (a `DISTINCT_SOURCES` allow-list + a thin `createDistinctRepository`);
  packages/ui holds only descriptor types and the executor registry.

## Security

The generic endpoint interpolates schema/table/column identifiers, so
authorization is a hard allow-list: `parseDistinctSource` validates all three
against `DISTINCT_SOURCES` (`schema.table` → column set) **before any SQL
composition** and throws 400 otherwise; `buildDistinctQuery` additionally
enforces `assertSafeIdentifier` + `allowedColumns` as defense in depth.
Request params never reach SQL directly.

## Consequences

- Loader data is fully serializable end-to-end; the manual COLUMNS re-attach
  workaround is gone and `enterprise-orders.loader.test.ts` /
  `car-sales.loader.test.ts` guard the no-functions contract.
- Deliberate behavior changes: `customer_name`, `product_category`,
  `product_subcategory` (enterprise-orders) gained fetchable select options;
  car-sales string columns gained distinct filter options for the first time.
- The legacy per-feature `/api/enterprise-orders/distinct/:columnName`
  endpoint, `createDistinctFilterOptions`, `createDistinctStringColumn`, and
  `enterpriseOrdersApi.fetchDistinctValues` were deleted.
- The pgAdmin future plugs in by generating columns from introspection and
  running them through the same append util; `DISTINCT_SOURCES` can then be
  populated dynamically.
