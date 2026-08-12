# Enterprise Orders Route Architecture

Enterprise table route for large-order operational data with a dedicated constants map for column behavior.

## Purpose

- Expose `/enterprise-orders` as a table-centric operational view.
- Configure table columns, pinning defaults, and route-specific rendering behavior.
- Keep route wiring (`loader`, `meta`, `layout`, `errorBoundary`) local to this folder.
- **The auth guard is currently NOT applied.** `authMiddleware` (`@/auth`) exists and
  is unit-tested, but `export const middleware = [authMiddleware]` is commented out in
  `root.ts` — it broke client-side navigation into the subtree — and the two resource
  routes (`_action/enterprise-orders/delete`, `_api/enterprise-orders/paginated`) do
  not export it either. **Treat this subtree and both endpoints as unauthenticated
  until that is resolved.** The create/edit actions still read the user from
  `context.get(authContext)` for `last_modified_by`.
- **Once re-enabled**, the guard belongs in three places — `root.ts` plus both resource
  routes — so the mutation and data endpoints are covered, not just the UI subtree.
  Unauthenticated requests then redirect to `/login?redirectTo=<url>`.

## Constants Responsibilities

The file [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx) owns:

- `PERSISTENCE_KEY` used by the table persistence layer.
- `COLUMNS` definitions, including filter adapters. `COLUMNS` no longer
  declares an `actions` entry: since `CRUD` (passed as `metaState.crud`)
  enables `read`/`update`/`delete`, `@lcabrera/ui/components/Table`'s
  `getInitialColumnsState` synthesizes and right-pins the row-actions column
  automatically (see `resolveTableActionsColumn` /
  `createActionsColumn` in `@lcabrera/ui/components/Table/utils`).

The route loader also uses `COLUMNS` as the source of truth for standalone URL filter validation, so mismatched filter payloads are discarded before the enterprise orders API request is built.

Columns are fully serializable (ADR-009): the loader decorates `COLUMNS`
with `appendDistinctFilterDescriptors({ transport: 'loader', schemaName,
tableName })` and returns them **inside** `columnsState` — no client-side
re-attach step. Static enum columns carry `kind: 'static'` descriptors from
`createStaticFilterOptions`; filterable string columns get baked
`kind: 'distinct'` descriptors that the client tool executes against the
same-origin `GET /_api/filter-options` resource route, whose loader reads
Postgres **directly, server-side** via `@lcabrera/server`'s
`selectFilterOptions` helper (`filter-options/.server/distinct.service.ts`).
That service holds no allow-list of its own: it derives both the allow-list and
each column's `ColumnType` from the per-entity `config/*DISTINCT_FILTER_COLUMNS`
maps (this route's lives in `config/enterpriseOrders.constants.ts`), so the
column set is declared once.
The `loader` transport keeps filter options on the same self-sufficient,
same-origin/direct-DB path as the rows, so they load under a bare
`react-router-serve` prod build with **no api-server, proxy, or CORS config**
(#340); the earlier `bff` transport fetched `:3001` cross-origin from the
browser and failed CORS there.
`enterprise-orders.loader.test.ts` guards the no-functions contract and the
descriptor wiring. The synthesized actions column is static, non-resizable,
and non-filterable by default, which prevents unpinning and width changes
from UI controls.

The actions-cell link content is center-aligned via route-local StyleX styles
so the icon button remains visually centered in the narrow pinned actions
column.

## Duplication Guardrail

- Repeated string columns are composed through `createBasicColumn(...)` from `@lcabrera/ui/components/Table/utils` in [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx); their distinct filter descriptors are appended once in the loader by `appendDistinctFilterDescriptors` (ADR-009) instead of per-column wiring.
- This keeps the descriptor params (`schemaName`/`tableName`/`columnName`) consistent across customer and shipping fields while preserving each column's label/width metadata.
- The row-actions column is likewise never hand-declared here — it's synthesized by `TableConfigProvider` (via `getInitialColumnsState` / `resolveTableActionsColumn`) from `CRUD`, keeping store initialization explicit and side-effect free.

## CRUD via route-driven modals

The list route is the **parent layout** (`root.ts` → `EnterpriseOrders.layout.tsx`),
which renders the table **plus an `<Outlet/>`**. The create/view/edit routes are its
children and render `<Modal><Form/></Modal>` into that outlet, so each opens as a modal
overlaid on the still-visible list (feature plan §4). At `/enterprise-orders` the outlet is
empty. `Modal.onClose` and the Form's Cancel navigate back to the list; a successful action
`redirect`s to the new/updated record's view.

- `new-order/` — `clientAction` (browser Zod validation → `serverAction` only on pass) +
  `action` (re-validate → assign `order_id` via `getMaxValue`+1 → derive totals →
  `insertRow` → redirect to view).
- `edit-order/` — `loader` (`selectRows` by `order_id`, 404 if missing) + `clientAction` +
  `action` (re-validate → recompute totals → `updateRows` → redirect to view).
- `order-detail/` — read-only `view`-mode Form; serves both `view/:orderId` and the bare
  `:orderId` route (the intentional duplicate detail routes, feature plan §8 item 5).
- `OrderFormModal/` — shared Modal+Form wrapper; `utils/orderFormFields.util.ts` builds the
  tab → card-group → row field tree per mode from the shared `@lcabrera/ui` Form builders
  (`createFieldBuilders<EnterpriseOrderValues>()`); `orderClientAction.ts` is the shared
  browser gate.

### `config/` — entity data + pure rules (no SQL, no `pg`)

Client-safe types (`EnterpriseOrder`, `EnterpriseOrderListRow`,
`EnterpriseOrderValues`), the `{ schema, table }` +
column/`allowedColumns`/`listColumns`/enum sets, the shared create/update **Zod schema**,
and pure derivation/mapping utils (`deriveOrderTotals`, `toOrderInsertValues`/
`toOrderUpdateValues`, `readOrderFormValues`, `toOrderFieldErrors`, `toOrderFormValues`,
`toOrderKeysetCursor`). Each util is pure with a colocated test.

Sort **translation** is not here, and the two read paths reach it differently.
The loader translates its already-tiebroken sorting with `toQuerySort`
(`@lcabrera/ui/routing/shared`); the paginated resource route composes
`sanitizeSorting` (same package) with `resolveQuerySort` (`@lcabrera/server/sort`),
because it also has to supply a fallback. All three are table-agnostic package
utils — none of them knows about orders, which is why none of them lives here.

The one sort value that _is_ table-specific does live here:
`ENTERPRISE_ORDER_FALLBACK_SORT`, the ordering the paginated read falls back to
when a request carries no sort at all. See the read path below for why it exists
at all, given the client always sends one.

### The read path — how a page of orders is paid for

Four things about `selectOrdersPage` are deliberate, and each one used to be the
obvious-but-slower spelling (epic #391):

- **The page and the count run concurrently**, not one after the other — they are
  independent queries, so the floor latency is the slower of the two rather than
  their sum. `getRowsCount` takes the data query's own `filters`/`allowedColumns`,
  so a page and its total still cannot drift apart.
- **The count runs on the first page of a scroll session only.** The total of a
  filtered set cannot change while the session runs, so `includeTotal` is true for
  the SSR loader and for `skip === 0`, and `total` is simply absent from every
  later page. The table keeps the total it holds when a page omits one
  (`resolveFetchMoreState`), so nothing downstream notices.
- **Load-more seeks rather than counts.** The table hands `onLoadMore` its last
  loaded row; `buildTablePageQuery` (`@lcabrera/ui/routing/shared`, reached through
  the loader meta's `isKeysetEnabled` — ADR-063) turns that into the sort-key tuple
  the server resumes after, so a deep page is O(limit) instead of O(offset)
  ([ADR-052](../../../../../docs/decisions/ADR-052-keyset-pagination-for-infinite-scroll.md)).
  `skip` is still sent, and `toOrderKeysetCursor` falls back to it whenever the
  cursor cannot be trusted — most concretely when the user's sort leaves
  `order_id` mid-list, so the sort is not a total order. Keyset is the
  optimization; `OFFSET` is the ground truth.
- **The list query projects `ENTERPRISE_ORDER_LIST_COLUMNS`, not the whole row.**
  Rows carry only what the table renders; the free-text, audit and address-detail
  columns no cell reads are no longer fetched, serialized and shipped per row per
  page. `EnterpriseOrderListRow` is that projection as a type. The detail and edit
  views still read the full row — they read one.

`COLUMNS` and the table are typed on `EnterpriseOrderTableRow`, which is
`EnterpriseOrderListRow` with optional members plus an optional group summary.
That is not a relaxation of the read model: a grouped read genuinely projects
only the group key and its aggregates, so on those rows every other column is
absent. `EnterpriseOrderListRow` keeps its exact shape and is still what the
ungrouped query returns, so the `Pick` behind it still turns a cell reading an
unprojected column into a compile error.

### Grouping — one key, server-side (ADR-061 / ADR-063)

**The route's entire opt-in is `isGroupingEnabled: true` on its loader `meta`.**
From that one flag: `createTableRouteLoader` reads the `grouping` search param,
sanitizes the keys against `COLUMNS`, seeds the table's grouping store, and hands
the keys to `fetchPage` — which forwards them to `selectOrdersPage` the same way
it already forwards `filters` and the effective sort. Remove the flag and the
param is ignored end to end, whatever the URL or the persisted UI-flags cookie
carries.

**Grouped rows travel in the same response.** `selectGroupedOrders` returns
`EnterpriseOrdersResponse` — the identical shape, with `hasMore: false`, because a
grouped read is not paginated
([ADR-059](../../../../../docs/decisions/ADR-059-aggregation-is-builder-generated.md)):
there is no stable cursor over a result the server aggregated. That invariance is
the point rather than a convenience — the loader's data type is inferred
structurally, so a response that branched on grouping would change the loader
type of all four table routes at once.

Each row carries a `TableGroupRowSummary` and nothing else, built by
`toOrderGroupRow`. It formats there rather than in the renderer because only this
side knows `count(*)` arrives as a **string** and that a NULL key is a real group.
`@lcabrera/ui`'s `TableGroupHeaderRow` renders the finished label and count.

**A hand-edited `grouping` param yields a flat table, never a partial one.** The
codec refuses any payload outside `{ keys: string[] }`, and
`sanitizeGroupingByColumns` refuses the whole list if one key is not a groupable
column of this route — key order is the query's nesting order, so dropping one
would answer a different question from the one the URL describes.

**Every page is ordered, and the route guarantees that itself.**
`parseOrdersPageParams` resolves the request's sort through `resolveQuerySort`
(`@lcabrera/server/sort`) against `ENTERPRISE_ORDER_FALLBACK_SORT`, so an empty
result is impossible. That looks redundant against the client — `buildTablePageQuery`
appends `order_id` via `appendPrimaryKeySorting`, so a scrolled page always arrives
sorted, and page 1 and page 2+ already agreed. It is not, because
`/_api/enterprise-orders/paginated` is a **public URL** and that guarantee lived
entirely in another package's client-side code: a direct request, a non-Table
consumer, or a column config that loses `isPrimaryKey` would otherwise produce a
paginated read with no `ORDER BY`, which repeats and skips rows as the planner
changes plans between requests. The fallback applies only to an empty sort, never
as an extra tiebreaker on one the caller supplied.

### `.server/enterpriseOrders.service.ts` — server-only Postgres access

Wraps the generic `@lcabrera/server` executors (`selectRows`/`selectGroupedRows`/
`getRowsCount`/`insertRow`/`updateRows`/`deleteRows`/`getMaxValue`) with the
enterprise-orders `{ schema, table, allowedColumns }` baked in — **no
entity-specific SQL**, grouped reads included: `selectGroupedRows` resolves each
column's grouping legality from the catalogue and emits the `GROUPING SETS` query
itself. It reaches Postgres via `getPool`, which reads `DB_*`
env (sourced from `docker/local/.env` by the app's `dev` script). The
`/_action/enterprise-orders/delete` action calls `deleteOrder` here, fixing the prior
api-server 404 (feature plan §8 bug 1).

**Why `.server/` and not `server/`:** the leading dot makes this a React Router
[server-only module](https://reactrouter.com/api/framework-conventions/server-modules)
directory — every file inside is stripped from the client bundle, and the **build fails**
if any client-reachable module imports it (RR 8's plugin matches `/\.server\//` on the
resolved path, so a nested `.server/` under `routes/` is enforced too). This upgrades the
old "imported only from loaders/actions" comment from a convention into a build-time
guarantee. Its consumers are exactly the server-only route modules: the list `loader`, the
`new`/`edit` `action`s, the `order-detail` `loader`, and the two resource routes
(`_api/enterprise-orders/paginated` loader, `_action/enterprise-orders/delete` action).
Route modules themselves must **never** be `.server` — they need both graphs — so the
server-only code lives here and they import it.
