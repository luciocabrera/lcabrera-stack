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

**`VITE_API_URL` points the same routes at an external `car-sales-api`** — the
loader through `readCarSalesPage` / `readWideAlltypes150Page`, the browser
through `fetchCarSalesPage` / `fetchWideAlltypes150Page`. Both endpoints answer
the identical `{ data, hasMore, total }`, so nothing downstream can tell which
one replied.

### It is a build-time switch

Read this part before pointing a deployment anywhere. `isExternalApiEnabled`
reads `import.meta.env.VITE_API_URL`, and **Vite substitutes that when the
bundle is produced**, not when the server starts. A production build therefore
folds the predicate to a constant and eliminates the losing branch:

| Built with                     | `build/server/index.js` contains                 |
| ------------------------------ | ------------------------------------------------ |
| _(nothing)_                    | `isExternalApiEnabled = () => { return false; }` |
| `VITE_API_URL=http://host/api` | `isExternalApiEnabled = () => { return true; }`  |

So **setting `VITE_API_URL` for `react-router-serve` does nothing** if the
bundle was built without it. There is no error: the folded self-hosted path
still works, and the deployment quietly keeps reading its own database. The
variable has to be present **for the build**:

```bash
VITE_API_URL=https://api.example.com/api vp run build
vp run start
```

Check which way a bundle actually folded, rather than trusting the environment:

```bash
grep -A2 'isExternalApiEnabled = () => {' apps/react-router/build/server/index.js
```

In **dev** there is no prebuilt bundle, so exporting the variable before the dev
server is enough — that is all `dev:external-api` does:

```bash
vp run db:up
vp run dev:external-api    # api-server + showcase, VITE_API_URL pre-set
```

and the self-hosted default:

```bash
vp run db:up
vp run dev:showcase        # showcase alone
```

### Keeping the override honest

An override nobody runs is an override that breaks silently, so it is exercised
two ways: `dev:external-api` by hand, and
`services/isExternalApiEnabled.util.test.ts` plus each fetcher's test in CI —
those stub `VITE_API_URL` and assert the request URL each branch produces, so a
change that quietly collapses the two paths into one fails the build. Note what
those tests can and cannot show: they run under Vitest, where `import.meta.env`
is live, so they prove **the branch is wired correctly**. That a given
_deployment_ took it is a property of how that deployment was built, and the
`grep` above is what answers it.

`enterprise-orders` has no override. It never had an external path worth keeping
— it was self-hosted from the start.

### Where the two paths disagree

One case, and it is documented rather than fixed here: sorting
`wide_alltypes_150.c_018` (`point`). The external endpoint answers `400` and the
route renders its error boundary; the self-hosted one drops the unorderable term
and answers a normal page ordered by the fallback key. The column's header is
clickable either way. Full table of both responses, and why the fix belongs in
its own change, in
[that route's ARCHITECTURE.md](../src/routes/wide-alltypes-150/ARCHITECTURE.md).
