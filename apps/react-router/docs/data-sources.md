# Where the showcase's table rows come from

Every table route in this app reads its rows from **Postgres, in this process**.
Nothing else has to be running for `/car-sales`, `/car-sales-infinite`,
`/wide-alltypes-150` and `/enterprise-orders` to render.

That is the whole point of the arrangement: a showcase that needs a second
repository started before it shows anything is not much of a showcase, and the
API servers are on their way out of this repo (#686, #687).

## The shape every table route has

Four routes, one shape — `enterprise-orders` is the reference implementation and
the other three now match it.

| Piece                                         | Where                                                                |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Entity configuration (schema, table, columns) | `routes/<route>/config/` — plain data, no SQL, no `pg`               |
| Postgres access                               | `routes/<route>/.server/<entity>.service.ts`                         |
| First page (SSR)                              | the route's `loader`, calling that service directly                  |
| Later pages (load-more)                       | a `_api/<entity>/paginated` resource route, calling the same service |
| Browser fetcher for those pages               | `services/<entity>.api.ts`                                           |

The resource routes:

| URL                                 | Serves                                        |
| ----------------------------------- | --------------------------------------------- |
| `/_api/car-sales/paginated`         | `car-sales-infinite`'s load-more              |
| `/_api/wide-alltypes-150/paginated` | `wide-alltypes-150`'s load-more               |
| `/_api/enterprise-orders/paginated` | `enterprise-orders`' load-more                |
| `/_api/filter-options`              | every route's distinct-value filter dropdowns |

Each answers raw JSON, consumed with plain `fetch` rather than the single-fetch
protocol. `/car-sales` has no load-more at all — it takes one bounded slice and
paginates it in the browser — so it uses only the loader half.

**The SSR half and the load-more half must answer the same shape**, and for
car-sales and wide-alltypes that takes one deliberate step: a `date` column
arrives from the driver as a `Date`, the resource route's `Response.json` turns
it into an ISO string, and React Router's single fetch does not — it revives a
`Date` as a `Date`. `toCarSaleRow` and `toWideAlltypes150Row` apply the JSON
rendering in the service, so both halves agree. `serializeDatabaseValue` is the
wide table's version of the same idea for `bytea`, `jsonb`, `interval` and
`point`.

`total` is on **every** page of these two endpoints, not only the first. That is
what the external endpoints answered and what these tables read;
`enterprise-orders` is the one that counts on the first page of a scroll session
only, because its client is built for a page that omits the total.

## Duplication, on purpose

`config/carSales.constants.ts` and `config/wideAlltypes150.constants.ts` carry
column lists that also exist in `apps/shared` (`api-shared`). They are **copied,
not imported** — `api-shared` must never become a runtime dependency of this app
([ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
and this app has to keep working once that package is no longer reachable at
all. The same reasoning already governs
`routes/enterprise-orders/config/enterpriseOrders.constants.ts`.

## The external-API override

Set **`VITE_API_URL`** and the same routes fetch their rows from an external
`car-sales-api` instead — the loader through `readCarSalesPage` /
`readWideAlltypes150Page`, the browser through `fetchCarSalesPage` /
`fetchWideAlltypes150Page`. Both endpoints answer the identical
`{ data, hasMore, total }`, so nothing downstream can tell which one replied.

Run it:

```bash
vp run db:up
vp run dev:external-api    # api-server + showcase, VITE_API_URL pre-set
```

and the self-hosted default:

```bash
vp run db:up
vp run dev:showcase        # showcase alone
```

An override nobody runs is an override that breaks silently, so it is exercised
two ways: `dev:external-api` by hand, and
`services/isExternalApiEnabled.util.test.ts` plus each fetcher's test in CI —
those stub `VITE_API_URL` and assert the request URL each branch produces, so a
change that quietly collapses the two paths into one fails the build.

`enterprise-orders` has no override. It never had an external path worth keeping
— it was self-hosted from the start.
