# Enterprise Orders Route

This route displays enterprise orders data with infinite scrolling capabilities.

## Route Information

- **Path**: `/enterprise-orders`
- **Component**: `EnterpriseOrders`
- **Data**: server-side Postgres via `@lcabrera/server` (list loader +
  `_api/enterprise-orders/paginated` resource route for load-more)

## Features

✅ **Infinite Scrolling** - Loads `INITIAL_PAGE_SIZE` rows, then that many again per scroll
✅ **Sorting** - Click column headers to sort (persisted in URL)
✅ **Column Management** - Show/hide columns, reorder, resize (persisted in cookies)
✅ **Large Dataset** - The whole `enterprise_orders` table, seeded at scale by
[`db/setup_enterprise_orders.sql`](../../../db/setup_enterprise_orders.sql);
`ENTERPRISE_ORDER_COLUMNS` lists every column and `ENTERPRISE_ORDER_LIST_COLUMNS`
the subset the list view projects
✅ **Diverse Data Types** - Currency, integers, decimals, text, booleans, dates

## Setup

### 1. Start Postgres

```bash
vp run db:up
```

### 2. Create the table and its demo rows

```bash
vp run --filter vite-react-compiler seed
```

This applies
[`db/setup_enterprise_orders.sql`](../../../db/setup_enterprise_orders.sql),
which:

- Creates the `enterprise_orders` table, with the columns
  `config/enterpriseOrders.constants.ts` lists in `ENTERPRISE_ORDER_COLUMNS`
- Generates the demo rows — the `generate_series` in the DDL is the count, and
  `SELECT count(*) FROM enterprise_orders` is what the database actually holds
- Creates indexes for performance

The route reads Postgres in this process, so no separate API server is needed.

### 3. Start the app

```bash
vp run dev:showcase
```

### 4. Navigate to Route

Open your browser to:

```
http://localhost:5173/enterprise-orders
```

## File Structure

```
src/routes/enterprise-orders/
├── layout.ts / enterprise-orders.layout.tsx  # List route: table + <Outlet/> for modals
├── EnterpriseOrders.component.tsx             # Data table
├── EnterpriseOrders.constants.tsx             # Table column definitions
├── enterprise-orders.loader.ts               # List loader (Suspense streaming)
├── enterprise-orders.meta.ts                 # Page metadata
├── EnterpriseOrders.error-boundary.tsx        # Error handling
├── config/                                    # Entity data + pure rules (types, Zod, derivation)
├── .server/enterpriseOrders.service.ts        # Server-only Postgres access (RR `.server/`: build-stripped from client)
├── OrderFormModal/                            # Shared Modal + Form wrapper
├── orderClientAction.ts                       # Shared browser Zod gate
├── utils/                                     # Route-local utils: orderFormFields (field-tree builder via @lcabrera/ui createFieldBuilders), parseOrderIdParam, buildAddressLocalityRows
├── new-order/                                 # Create route (clientAction + action)
├── edit-order/                                # Edit route (loader + clientAction + action)
└── order-detail/                              # Read-only view route (Form `view` mode)
```

## CRUD flow

Create / view / edit render **inside `@lcabrera/ui` Modal** overlaid on the list (route-driven
modals — the parent renders the table + `<Outlet/>`). Submissions validate client-first via
`clientAction` (Zod), then delegate to the server `action`, which re-validates, persists via
the generic `@lcabrera/server` write builders (direct Postgres — no external API), and
redirects. Requires local Postgres (`vp run db:up`) with the `DB_*` env the `dev` script
sources from `docker/local/.env`.

## Data access

Reads go through the generic `@lcabrera/server` query builders/executors (no
external API). `.server/enterpriseOrders.service.ts` exposes `selectOrdersPage`
(list + count), `selectOrderById`, `getNextOrderId`, `insertOrder`,
`updateOrder`, `deleteOrder`. The table's `ColumnFiltersState`/`SortingState`
are translated to generic `QueryFilter[]`/`QuerySort[]` by two table-agnostic
mappers shared by any table — `@lcabrera/server/filters`' `toQueryFilters` and
`@lcabrera/ui/routing/shared`'s `toQuerySort`; the browser load-more calls
`fetchOrdersPage` → the `_api/enterprise-orders/paginated` resource route.

> Filter translation note: every table filter operator maps to SQL — range
> (`between`), multi-select NOT-IN, and text **notContains** (now `NOT ILIKE`,
> via the generic `notIlike` operator) are all preserved.

## Columns (`ENTERPRISE_ORDER_LIST_COLUMNS` is what the list view projects)

### Order Information

- Order ID, Order Number, Order Date, Status, Priority

### Customer Information

- Customer Name, Email, Type, VIP Status, Loyalty Points

### Financial Data

- Total Amount, Subtotal, Tax, Shipping Cost, Discount

### Payment Information

- Payment Status, Payment Method

### Product Information

- Category, Subcategory, Quantity, Unit Price

### Shipping Information

- Ship City, Ship State, Ship Country, Carrier, Warehouse

### Additional Flags

- Rush Order, Gift, Customer Rating

### Dates

- Delivery Date, Shipped Date

## State Persistence

### URL Parameters (Priority)

- Sorting: `?sort=[{"columnKey":"order_date","direction":"desc"}]`
- Column visibility, order (encoded in URL)

### Cookies (Fallback)

- Column order
- Column visibility
- Column sizing
- Sorting

### Persistence Key

`enterprise-orders-table`

## Infinite Scroll Configuration

```typescript
{
  initialPageSize: 50,      // Initial records loaded
  loadMorePageSize: 50,     // Records per scroll
  threshold: 200,           // Pixels from bottom to trigger load
  strategy: 'offset-limit', // Pagination strategy
  isEnabled: true           // Enable/disable infinite scroll
}
```

## Performance

What makes a page of this table cheap — and why each choice was made — is
"The read path — how a page of orders is paid for" in
[`ARCHITECTURE.md`](ARCHITECTURE.md). The indexes it leans on are declared in
[`db/setup_enterprise_orders.sql`](../../../db/setup_enterprise_orders.sql), and
what the database actually holds is `SELECT count(*) FROM enterprise_orders`.

Latency figures are deliberately not kept here: a measurement with no hardware,
dataset or date attached cannot be corrected, only removed, and nothing checks a
number written into a doc (AGENTS.md §7). The figures for a given change belong
in that change's PR.

## Testing

With `vp dev` running (local Postgres up via `vp run db:up`), exercise the
load-more resource route directly. `vp dev` prints the port it bound on startup —
5173 unless something already holds it, in which case substitute the port it
actually named.

```bash
# Basic page
curl "http://localhost:5173/_api/enterprise-orders/paginated?skip=0&limit=10"

# With filters (VIP customers)
curl -G "http://localhost:5173/_api/enterprise-orders/paginated" \
  --data-urlencode 'skip=0' \
  --data-urlencode 'limit=10' \
  --data-urlencode 'filter={"is_vip_customer":{"type":"boolean","value":true}}'

# The window is bounded (#706): this prints MAX_ENTERPRISE_ORDERS_LIMIT, not the
# table's row count. The same limit on /enterprise-orders changes nothing —
# that first page is INITIAL_PAGE_SIZE and takes no window from the URL.
# Counted with node rather than jq, which this repo does not require.
curl -s "http://localhost:5173/_api/enterprise-orders/paginated?skip=0&limit=999999999" \
  | node -e "let s='';process.stdin.on('data',c=>s+=c).on('end',()=>console.log(JSON.parse(s).data.length))"
```

Unit tests cover the pure translation utils, the param parser, the fetcher, the
resource loader, and the service (`vp run test`) — all with the pg pool and fetch
mocked, so they need no database.

A **live-DB smoke test** (`.server/enterpriseOrders.smoke.test.ts`) covers what the
mocks can't: the demo-login credential check against the env-configured hash, and a
real create → read → update → list/count → delete round-trip through the generic
`@lcabrera/server` builders. It is **gated behind `SMOKE_DB`** so the default
`vp run test` and the DB-less CI unit job skip it. Run it against a local Postgres:

```bash
vp run db:up          # once, from the repo root
vp run test:smoke     # from apps/react-router — sources DB_* + sets SMOKE_DB
```

The suite deletes the single row it creates (the delete is part of the flow), so it
is safe to re-run.

The grouped-read guard rails have their own live suite in
[`src/.server/`](../../.server/ARCHITECTURE.md) — the statement timeout firing and
the pool default surviving on the same pooled connection are claims a mocked test
reports green either way.

`.server/groupingRefusalSurface.smoke.test.tsx` is the same kind of claim on the
**client** side: which of this table's columns the live catalogue refuses as a
group key, and what a user then sees. A mocked capability map shows only that the
component renders whatever it was handed, so this one resolves the real
capabilities, drives the route's real `loader` for every refused column —
asserting each `dataPromise` **resolves** rather than reaching the error boundary
— and renders the real route component to check the refusal is on screen, naming
the column. It runs a legal key as the control, without which "the refusal shows"
would also pass for a component that showed it unconditionally.

## Next Steps

- [x] Add detail view for individual orders (read-only `view`-mode Form modal)
- [x] Add create/edit flows (Form modals with client-first Zod validation)
- [ ] Add export to CSV functionality
- [ ] Add charts/analytics view
- [ ] Implement real-time updates

## Related Documentation

- Database setup: [`db/README.md`](../../../db/README.md)
- The DDL this route needs: [`db/setup_enterprise_orders.sql`](../../../db/setup_enterprise_orders.sql)
- Column reference: `config/enterpriseOrders.constants.ts` (`ENTERPRISE_ORDER_COLUMNS`)
- How this route is wired: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
