# Car Sales Route Architecture

`/car-sales` renders the `car_sales` table and paginates it **in the browser**:
one bounded slice arrives with the document and no further request is ever made.
Its sibling `/car-sales-infinite` renders the same table and the same columns
through infinite scroll; the two share this folder's `COLUMNS` and `config/`.

## Purpose

- Demonstrate in-memory pagination over a slice of a 500k-row table.
- Own the `car_sales` entity configuration for both car-sales routes and for the
  same-origin `/_api/filter-options` service.
- Serve its own rows, so the showcase renders with nothing running but Postgres.

## Files

```text
car-sales/
├── ARCHITECTURE.md
├── .server/
│   └── carSales.service.ts        # Postgres access + the data-source choice
├── config/
│   ├── carSales.constants.ts      # schema/table/columns/allow-list/fallback sort
│   ├── carSales.types.ts          # CarSaleRow — the row as the driver returns it
│   ├── toCarSaleRow.util.ts       # driver row → the JSON shape the table reads
│   └── index.ts
├── CarSales.component.tsx
├── CarSales.constants.tsx         # COLUMNS, TITLE, CLIENT_PAGINATION_ROW_LIMIT
├── CarSales.error-boundary.tsx
├── car-sales.loader.ts
├── car-sales.meta.ts
└── root.ts
```

## Data Flow

1. `car-sales.loader.ts` restores persisted table state from URL params and
   cookies into loader-seeded `columnsState` and `metaState`, and bakes
   `transport: 'loader'` distinct-filter descriptors onto the filterable string
   columns (ADR-009).
2. It calls **`readCarSalesPage`** (`.server/carSales.service.ts`) for
   `CLIENT_PAGINATION_ROW_LIMIT` rows and returns the promise unawaited, for
   Suspense streaming.
3. `CarSales.component.tsx` renders `TableLayout` with `dataTotalSelector`
   reporting `data.length` rather than the server's `total` — the rows this
   route loaded are the rows it will ever have, and reporting the table's full
   height would advertise rows no interaction can reach.

`/car-sales` therefore never touches a paginated endpoint after the document.
`/car-sales-infinite` does, and both go through the same service — see
[that route's ARCHITECTURE.md](../car-sales-infinite/ARCHITECTURE.md).

## Where the rows come from

`readCarSalesPage` picks the source; `selectCarSalesPage` beneath it is the
Postgres read, composed entirely from the generic `@lcabrera/server` executors
(`selectRows` + `getRowsCount`) with no entity-specific SQL.

- **Default — this process.** No API server is involved (#687).
- **Built with `VITE_API_URL`** — the external `car-sales-api`, which answers
  the identical `{ data, hasMore, total }`. Build-time, not runtime: Vite
  substitutes the variable into the bundle, so setting it at server start does
  nothing. See [`docs/data-sources.md`](../../../docs/data-sources.md).

Three properties of the read are deliberate:

- **The page and the count run concurrently.** They are independent queries, so
  the floor latency is the slower of the two rather than their sum.
- **The count runs on every page.** `enterprise-orders` counts only on the first
  page of a scroll session, because its client is built for a page that omits
  `total`; this endpoint's response has always carried one, and its table reads
  one from every page. Dropping it would change the response shape rather than
  just its cost.
- **`toCarSaleRow` renders the three `date` columns as ISO strings.** The
  resource route's `Response.json` would do that anyway; the SSR loader would
  not, because single fetch revives a `Date` as a `Date`. Without the step, the
  first page and every load-more page after it would reach the table in
  different shapes. `CarSaleRow` names the difference in the type system, so a
  new date column cannot be added without deciding about it.

There is no `filters` argument: this endpoint never filtered server-side. Both
car-sales routes filter in the browser over rows they already hold, and neither
declares `isServerFilterEnabled` (ADR-063), so no `filter` param is ever sent.

## Guardrails

- `config/` holds **plain data and pure rules only** — no SQL, no `pg`. Its
  column list is copied, not imported, from the api layer
  ([ADR-039](../../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)).
- `.server/` is a React Router server-only directory: the build fails if
  client-reachable code imports it. Import it only from loaders and actions.
- `COLUMNS` lives in `CarSales.constants.tsx` and is shared by both car-sales
  routes; a column added there must also exist in `CAR_SALES_COLUMNS`, which the
  colocated constants test asserts.
