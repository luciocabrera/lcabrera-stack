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

The file [EnterpriseOrders.constants.tsx](./EnterpriseOrders.constants.tsx) owns:

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
`react-router-serve` prod build with **no external API, proxy, or CORS config**
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

- Repeated string columns are composed through `createBasicColumn(...)` from `@lcabrera/ui/components/Table/utils` in [EnterpriseOrders.constants.tsx](./EnterpriseOrders.constants.tsx); their distinct filter descriptors are appended once in the loader by `appendDistinctFilterDescriptors` (ADR-009) instead of per-column wiring.
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

`COLUMNS` and the table are typed on `EnterpriseOrderTableRow`, a **discriminated
union**: either a data row carrying every projected column, or one group summary
carrying none of them. `EnterpriseOrderListRow` keeps its exact shape and is
still what the ungrouped query returns, so the `Pick` behind it still turns a
cell reading an unprojected column into a compile error.

A union rather than an intersection of partials, because the partial shape says
"any field may be missing from any row" where the data says "one row kind has
all of them, the other has none" — and no runtime check could recover the type
from the weaker claim. `TABLE_GROUP_ROW_FIELD` is the type-level discriminant
and `getTableGroupRowSummary` the runtime one, so the check `TableBodyRows`
already makes now also narrows. `config/enterpriseOrders.types.test.ts` pins
that: its body only compiles while narrowing works.

The residual cost is small and named: a discriminant must exist on both arms and
`DataKey<TData>` is `keyof TData`, so `tableGroup` type-checks where a column key
is expected on this route. It is inert — no such column is declared, and the
constants test pins `COLUMNS` to the projected list — and removing it would mean
changing `TableColumn`'s key/render typing in `@lcabrera/ui`, which is a package
decision rather than this route's.

### What bounds a read of this table

`/_api/enterprise-orders/paginated` is a public, unauthenticated URL (see the
auth note at the top) over a table this app seeds at scale
([`db/setup_enterprise_orders.sql`](../../../db/setup_enterprise_orders.sql)),
so every request-derived number that reaches SQL is bounded. The window and the
ORDER BY length were added by #706, which made this the last of the three
paginated routes to close that gap; the sibling tables are `MAX_CAR_SALES_LIMIT`
/ `MAX_CAR_SALES_SORT_RULES` in
[`car-sales/ARCHITECTURE.md`](../car-sales/ARCHITECTURE.md) and
`MAX_WIDE_ALLTYPES_*` in `wide-alltypes-150/config/`.

| Input               | Bound                                     | Where                                                   |
| ------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `limit`             | `[1, MAX_ENTERPRISE_ORDERS_LIMIT]`        | `selectOrdersPage`, so **every** entry point is covered |
| sort terms          | `MAX_ENTERPRISE_ORDERS_SORT_RULES`        | the same place, for the same reason                     |
| sort/filter columns | `allowedColumns` + `assertSafeIdentifier` | `@lcabrera/server`'s builder                            |
| group keys          | `MAX_GROUP_KEYS`                          | `sanitizeGroupingByColumns` + `assertGroupDepth`        |
| grouped rows        | `ENTERPRISE_ORDER_GROUP_MAX_ROWS`         | `selectGroupedRows` — a grouped result, not a page      |

**Two entry points can size this read, and only one of them parses a request.**
The resource route takes its window from search params through
`parseOrdersPageParams`; the SSR loader takes its own from `INITIAL_PAGE_SIZE`
and never touches that parser. So both bounds live in `selectOrdersPage`, the
one function both reach, rather than in the parser — which is where the sibling
routes clamp `limit`, and where a clamp would cover half of this route's surface
and have to be written a second time to cover the rest. #701 found the same split
on car-sales and bounded that route's sort in its service for exactly this
reason. `.server/pageWindowContract.test.ts` drives both entry points against a
mocked executor layer and asserts the descriptor the builder would have run.

**The ceiling is this route's own constant, not a borrowed one.**
`CLIENT_PAGINATION_ROW_LIMIT` holds the same number but is `/car-sales`'s UI
pagination decision, so importing it would mean lowering that demo's page size
quietly changed what a public endpoint serves — the coupling runs in the unsafe
direction. `ENTERPRISE_ORDER_GROUP_MAX_ROWS` is not the page window either: it
bounds a grouped result, which is returned whole and never scrolled (ADR-059).
Neither bound can truncate anything a user can ask for — both readers of this
table request `INITIAL_PAGE_SIZE`, and a sort longer than the table has columns
necessarily repeats a column already named.

**`skip` is deliberately not capped**, as on the sibling routes. An offset past
the end returns an empty page after work bounded by the table rather than by the
request, so unlike `limit` there is no value of it that makes the response or the
read unbounded.

### Grouping — several keys and selected aggregates, server-side (ADR-061 / ADR-063)

**The route's entire opt-in is `isGroupingEnabled: true` on its loader `meta`.**
From that one flag: `createTableRouteLoader` reads the `grouping` search param,
sanitizes the configuration against `COLUMNS`, seeds the table's grouping store,
and hands it to `fetchPage` — which forwards it to `selectOrdersPage` the same
way it already forwards `filters` and the effective sort. Remove the flag and the
param is ignored end to end, whatever the URL or the persisted UI-flags cookie
carries.

**Several keys, to the configured depth.** The `grouping` param carries an
ordered `keys` list, and the order is the grouped query's nesting order. Past
`MAX_GROUP_KEYS` every layer refuses rather than truncating: the UI disables the
affordance, `sanitizeGroupingByColumns` drops the whole configuration, and
`assertGroupDepth` throws **before the executor borrows a connection**, so a
hand-edited depth-9 URL costs no catalogue query.

**Rollup emits the subtotals, and the mask is what makes them readable.** The
`grouping` param carries a `mode` beside the keys, and `rollup` asks the builder
for one grouping set per prefix of the key list plus the empty grand total. Each
row comes back with `GROUPING(k₁, …, kₙ)` under `maskAlias`, which is the only
thing separating a **real** NULL key from a **structural** one — the two rows are
textually identical. `@lcabrera/server`'s `toGroupRow` decodes it (ADR-082): the
keys whose bit is set are
dropped from `path`, so the path that remains is the row's own prefix and its
length is the row's depth, and `isSubtotal` says whether anything was rolled up
at all. A `flat` read never sets a bit, so every row is a leaf and the decode is
the identity it always was.

**The ordering keeps subtotals with their children.** `buildGroupOrderByClause`
emits `GROUPING(key) ASC, key <user>` per key, so a subtotal lands after the rows
it totals whichever direction the user sorted that key by, and the grand total
lands last.

The user's sort **reaches** that clause: `selectGroupedOrders` emits one term per
group key in nesting order, carrying the applied direction where the user sorted
that key and ascending where they did not. Nesting order is not the sort's to
change — it is the tree — so a sort sets a level's direction rather than
reordering the levels, and a sort on a column the grouped read does not project
is dropped, because a grouped result has no row of that column's values to
order.

**An aggregate sort is a term of its own, appended after the keys** (#869).
Each selected aggregate renders as its own grid column, so clicking that
column's header sorts by the measure: `toGroupSort` turns a sort naming one of
this read's requested aggregates into `GroupSort`'s `aggregateAlias` arm and
places it last. Position is what decides which level an aggregate orders — after
every key it orders the innermost siblings within their parent — and one that
would rank an ancestor is refused at construction rather than emitted as a term
that orders nothing.

**The aggregate menu is the catalogue's answer, not the column's declared type.**
`selectOrderGroupingCapabilities` resolves what every allowed column may do from
`pg_type`/`pg_aggregate`, and the loader ships that on
`metaState.groupingCapabilities` so the menu can be built client-side. It has to
come from the server: `TableColumn.dataType` reports `numeric`, `jsonb` and
`point` all as `string`, so a menu built from it offers `sum` on columns that
cannot take it and hides it on `total_amount`, which can
([ADR-058](../../../../../docs/decisions/ADR-058-grouping-legality-by-analytical-role.md), #550).
That is one extra catalogue query per page load on this route, issued **before**
the loader awaits it and therefore concurrent with the data query; the measured
cost is recorded in the PR for #569 rather than here, where it would rot.

**Filtered aggregates are deferred, and closed on every path this route has**
(#569). The compact `grouping` param carries a column-to-function map with no
slot for a filter or an alias, so a filtered aggregate cannot round-trip through
the only transport this configuration has. `selectGroupedOrders` builds
`UnfilteredOrderAggregate` — `GroupAggregate` with the `filters` and `alias`
slots removed — so this route's type refuses one as well as its UI never
offering one. The slot still exists on `@lcabrera/server`'s `GroupAggregate`,
which is what a later slice will widen; nothing here reaches it.

**Grouped rows travel in the same response.** `selectGroupedOrders` returns
`EnterpriseOrdersResponse` — the identical shape, with `hasMore: false`, because a
grouped read is not paginated
([ADR-059](../../../../../docs/decisions/ADR-059-aggregation-is-builder-generated.md)):
there is no stable cursor over a result the server aggregated. That invariance is
the point rather than a convenience — the loader's data type is inferred
structurally, so a response that branched on grouping would change the loader
type of all four table routes at once.

Each row carries a `TableGroupRowSummary` and nothing else, built by
`@lcabrera/server`'s `toGroupRow` — a table feature rather than a route one, so
it ships with the package that writes the mask it reads (ADR-082). Its `path`
names the levels **that row is actually grouped
by**, in nesting order — which under `rollup` is a prefix of the key list rather
than all of it: a subtotal carries one level fewer than the rows it totals, and
the grand total carries none. `isSubtotal` says which it is, and `aggregates`
carries each selected aggregate decoded by the alias the builder reported. It
formats there rather than in the renderer because only this side knows
`count(*)` arrives as a **string**, that a `numeric` aggregate does too, and
that a NULL key is a real group. `@lcabrera/ui` renders the finished labels and
count in the group key's own column (ADR-080).

**A hand-edited `grouping` param yields a flat table, never a partial one.** The
codec refuses any payload outside `{ keys: string[], agg?: … }` with a known
aggregate token, and `sanitizeGroupingByColumns` refuses the whole configuration
if one key is not a groupable column of this route, if the list is longer than
the cap, or if an aggregate names a column this route does not declare — key
order is the query's nesting order, so dropping one would answer a different
question from the one the URL describes.

**A refused grouping is plain data on the response, never an error class.** A key
or an aggregate the _catalogue_ refuses — a primary key, a `jsonb` column, `sum`
on a `varchar` — plus a grouping estimated past the row ceiling and a query the
statement timeout cut off, all reach `selectGroupedOrders` as
`@lcabrera/server` error classes. It maps every one through
`toSerializableDbError` and returns it as `response.error`
([ADR-066](../../../../../docs/decisions/ADR-066-grouping-guard-rails-and-per-query-timeout.md)).

That mapping is not a style choice. React Router single fetch drops functions, so
a class arrives at the client with no prototype and — `Error.message` being
non-enumerable — no message either, silently. The union gives the client a `kind`
to branch on and a message that is this package's own, never the driver's; it is
the loader-side mirror of what the mutating actions already do with a field-error
object ([ADR-050](../../../../../docs/decisions/ADR-050-server-error-translation-and-result-contract.md)).

**And the table renders it** (#642,
[ADR-068](../../../../../docs/decisions/ADR-068-a-refused-read-is-rendered-data-not-an-exception.md)).
`TableRouteView` defaults its `dataErrorSelector` to `response.error`, so this
route wires nothing for it: the empty body names the refused column by its
header label, prints the endpoint's own sentence, and offers **Clear grouping**
in place of Retry — repeating the request would be refused again for the same
reason.

Reaching one now takes a hand-edited URL. Both menus are built from the shipped
capabilities: the aggregate list from `aggregates`, and — since #642 — the
group-by item and the drawer's add-key list from `canGroup`, which the catalogue
refuses for a large share of this table's columns. The two gates answer at
different times, though, so the rendering half is not made redundant by the menu
half: the pre-flight row bound is a property of the whole key combination,
statistics move under a loaded page, and `grouping` is user-editable URL state
(ADR-061).

Re-derive the current refusal split with
`.server/groupingRefusalSurface.smoke.test.tsx` (`vp run test:smoke`) rather than
reading a number here — it comes from `n_distinct` and moves with the data.

**A grouped read that ran on missing statistics says so.** `response.groupingWarning`
carries `stats-unavailable` (the table has never been analysed, so nothing could
estimate the result) or `estimate-above-warn-threshold`. The rows beside it are
real — a warning is not an error — and **nothing renders it yet**: #642 covered
the refusal, not the warning.

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
external-API 404 (feature plan §8 bug 1).

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
