# Enterprise Orders Route

This route displays enterprise orders data with infinite scrolling capabilities.

## Route Information

- **Path**: `/enterprise-orders`
- **Component**: `EnterpriseOrders`
- **Data**: server-side Postgres via `@repo/data-access` (list loader +
  `_api/enterprise-orders/paginated` resource route for load-more)

## Features

✅ **Infinite Scrolling** - Loads 50 records initially, then 50 more as you scroll
✅ **Sorting** - Click column headers to sort (persisted in URL)
✅ **Column Management** - Show/hide columns, reorder, resize (persisted in cookies)
✅ **100,000 Records** - Displays large dataset with ~50 columns
✅ **Diverse Data Types** - Currency, integers, decimals, text, booleans, dates

## Setup

### 1. Create Database Table

```bash
cd /home/lucio/workspace/db
./setup_orders.sh
```

This will:

- Create the `enterprise_orders` table with 52 columns
- Generate 100,000 realistic records
- Create indexes for performance

### 2. Start API Server

```bash
cd /home/lucio/workspace/frameworks/vite-react-compiler/api-server
vp run start
```

The API will be available at `http://localhost:3001`

### 3. Start React App

```bash
cd /home/lucio/workspace/frameworks/vite-react-compiler
vp dev
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
├── enterprise-orders.errorBoundary.tsx       # Error handling
├── config/                                    # Entity data + pure rules (types, Zod, derivation)
├── .server/enterpriseOrders.service.ts        # Server-only Postgres access (RR `.server/`: build-stripped from client)
├── OrderFormModal/                            # Shared Modal + Form wrapper
├── orderClientAction.ts                       # Shared browser Zod gate
├── utils/                                     # Route-local utils: orderFormFields (field-tree builder via @repo/ui createFieldBuilders), parseOrderIdParam, buildEnterpriseOrdersQuery
├── new-order/                                 # Create route (clientAction + action)
├── edit-order/                                # Edit route (loader + clientAction + action)
└── order-detail/                              # Read-only view route (Form `view` mode)
```

## CRUD flow

Create / view / edit render **inside `@repo/ui` Modal** overlaid on the list (route-driven
modals — the parent renders the table + `<Outlet/>`). Submissions validate client-first via
`clientAction` (Zod), then delegate to the server `action`, which re-validates, persists via
the generic `@repo/data-access` write builders (direct Postgres — no api-server), and
redirects. Requires local Postgres (`vp run db:up`) with the `DB_*` env the `dev` script
sources from `docker/local/.env`.

## Data access

Reads go through the generic `@repo/data-access` query builders/executors (no
api-server). `.server/enterpriseOrders.service.ts` exposes `selectOrdersPage`
(list + count), `selectOrderById`, `getNextOrderId`, `insertOrder`,
`updateOrder`, `deleteOrder`. The table's `ColumnFiltersState`/`SortingState`
are translated to generic `QueryFilter[]`/`QuerySort[]` by the generic
`@repo/data-access/filters` `toQueryFilters` mapper (table-agnostic, shared by
any table) and the app-local `config/toOrderQuerySort` util; the browser
load-more calls `fetchOrdersPage` → the `_api/enterprise-orders/paginated`
resource route.

> Filter translation note: every table filter operator maps to SQL — range
> (`between`), multi-select NOT-IN, and text **notContains** (now `NOT ILIKE`,
> via the generic `notIlike` operator) are all preserved.

## Columns (31 displayed by default)

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

- **Initial Load**: ~50ms (indexed queries)
- **Scroll Load**: ~50ms per 50 records
- **Total Records**: 100,000
- **Indexed Columns**: 11 frequently queried columns

## Testing

With `vp dev` running (local Postgres up via `vp run db:up`), exercise the
load-more resource route directly:

```bash
# Basic page
curl "http://localhost:3000/_api/enterprise-orders/paginated?skip=0&limit=10"

# With filters (VIP customers)
curl -G "http://localhost:3000/_api/enterprise-orders/paginated" \
  --data-urlencode 'skip=0' \
  --data-urlencode 'limit=10' \
  --data-urlencode 'filter={"is_vip_customer":{"type":"boolean","value":true}}'
```

Unit tests cover the pure translation utils, the param parser, the fetcher, the
resource loader, and the service (`vp run test`) — all with the pg pool and fetch
mocked, so they need no database.

A **live-DB smoke test** (`.server/enterpriseOrders.smoke.test.ts`) covers what the
mocks can't: the demo-login credential check against the env-configured hash, and a
real create → read → update → list/count → delete round-trip through the generic
`@repo/data-access` builders. It is **gated behind `SMOKE_DB`** so the default
`vp run test` and the DB-less CI unit job skip it. Run it against a local Postgres:

```bash
vp run db:up          # once, from the repo root
vp run test:smoke     # from apps/react-router — sources DB_* + sets SMOKE_DB
```

The suite deletes the single row it creates (the delete is part of the flow), so it
is safe to re-run.

## Next Steps

- [x] Add detail view for individual orders (read-only `view`-mode Form modal)
- [x] Add create/edit flows (Form modals with client-first Zod validation)
- [ ] Add export to CSV functionality
- [ ] Add charts/analytics view
- [ ] Implement real-time updates

## Related Documentation

- Database setup: `/home/lucio/workspace/db/ENTERPRISE_ORDERS_README.md`
- Quick start: `/home/lucio/workspace/db/QUICK_START.md`
- Column reference: `/home/lucio/workspace/db/COLUMNS_REFERENCE.md`
- System overview: `/home/lucio/workspace/db/SYSTEM_OVERVIEW.md`
