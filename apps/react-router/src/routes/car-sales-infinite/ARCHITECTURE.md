# Car Sales (Infinite Scroll) Route Architecture

`/car-sales-infinite` renders the same `car_sales` table as `/car-sales`, with
the same columns, through **infinite scroll**: the loader brings one page and
the browser asks for the next as the user reaches the end.

## Purpose

- Demonstrate server-paginated infinite scroll over a 500k-row table.
- Reuse `/car-sales`'s `COLUMNS` and entity `config/` rather than forking them —
  the two routes differ in pagination strategy and nothing else.

## Files

```text
car-sales-infinite/
├── ARCHITECTURE.md
├── CarSales.component.tsx        # TableRouteView + fetchCarSalesPage
├── CarSales.constants.tsx        # this route's own PERSISTENCE_KEY and TITLE
├── CarSales.types.ts
├── CarSalesInfinite.error-boundary.tsx
├── car-sales.loader.ts
├── car-sales.meta.ts
└── root.ts
```

The entity configuration, the Postgres access and the row mapping all live in
[`../car-sales/`](../car-sales/ARCHITECTURE.md); this folder holds only what
differs.

## Data Flow

1. `car-sales.loader.ts` restores persisted table state and bakes the
   `transport: 'loader'` distinct-filter descriptors (ADR-009), then calls
   **`readCarSalesPage`** (`../car-sales/.server/carSales.service.ts`) for
   `INITIAL_PAGE_SIZE` rows and returns the promise unawaited for Suspense
   streaming.
2. `CarSales.component.tsx` renders `TableRouteView` with `fetchCarSalesPage`,
   which the table calls for every page after the first.
3. Those pages come from **`GET /_api/car-sales/paginated`**
   (`routes/api/car-sales-paginated/`), whose loader parses `limit`/`skip`/`sort`
   and calls the same `selectCarSalesPage` the SSR loader reached directly.

So the first page and every page after it are produced by one function, and no
API server is involved (#687). Setting `VITE_API_URL` sends both halves to the
external `car-sales-api` instead; the response shape is identical either way.

## Capabilities this route does not declare

The loader's `meta` declares neither `isKeysetEnabled` nor
`isServerFilterEnabled`, and absent means off (ADR-063) — this endpoint pages by
offset and sorts, and understands neither a keyset cursor nor a server-side
filter. The load-more therefore carries `limit`, `skip` and `sort` only, and
`buildTablePageQuery` appends the `car_id` tiebreaker so page _n+1_ is ordered
the same way page 1 was (ADR-008).

The resource route resolves the request's sort against `CAR_SALES_FALLBACK_SORT`
rather than trusting the client to have sent one. That looks redundant against
the Table, which always appends the primary key — it is not, because
`/_api/car-sales/paginated` is a public URL, and a paginated read with no
`ORDER BY` repeats and skips rows as the planner changes plans between requests.

## Guardrails

- Keep this route's `PERSISTENCE_KEY` distinct from `/car-sales`'s: the two
  render the same data with different pagination, and sharing a key would make
  one route's persisted state reopen the other's.
- Do not fork `COLUMNS`. A column belongs to the entity, not to a pagination
  strategy.
