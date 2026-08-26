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
column lists that also exist in the external API's domain layer. They are
**copied, not imported** — that layer must never become a runtime dependency of
this app
([ADR-039](../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)),
and this app has to keep working when that layer is not reachable at all. That
stopped being hypothetical in #686, which moved it out of this repository; the
copies are why nothing here had to change. Treat the lists here as the
authority — they are what the routes render, and the colocated constants tests
check them against the columns each table actually has. The same reasoning
already governs
`routes/enterprise-orders/config/enterpriseOrders.constants.ts`.

## The external-API override

**`VITE_API_URL` points the same routes at an external API server** — the
loader through `readCarSalesPage` / `readWideAlltypes150Page`, the browser
through `fetchCarSalesPage` / `fetchWideAlltypes150Page`. Both endpoints answer
the identical `{ data, hasMore, total }`, so nothing downstream can tell which
one replied.

**Whether** the external path is taken is one app-local util,
`isExternalApiEnabled`. **Where** it goes is not the app's business any more:
`@lcabrera/api`'s `getApiBaseUrl` ranks `VITE_API_URL` above the SSR request URL
since #705, so the loader and the browser resolve the same host and the fetchers
simply pass it as their `resolveBaseUrl`.

This app used to carry a `resolveExternalApiBaseUrl` that inverted the package's
order for itself, because `getApiBaseUrl` ranked the request URL first: handed
one by a loader it never read the variable, so the loader fetched the request's
own origin while the browser fetched the override. That util and its
`readExternalApiUrl` helper are gone — the package answers correctly now, and a
second answer in the app would be a second thing to keep in step.

The one agreement that still spans the boundary: **an empty `VITE_API_URL`
counts as unset on both sides.** `isExternalApiEnabled` checks it explicitly and
`getApiBaseUrl` checks truthiness, so a bare `export VITE_API_URL=` selects
neither the external branch nor an origin of `''`.

### It is a build-time switch

Read this part before pointing a deployment anywhere. `isExternalApiEnabled`
reads `import.meta.env.VITE_API_URL`, and **Vite substitutes that when the
bundle is produced**, not when the server starts. A production build therefore
folds the predicate to a constant and eliminates the losing branch:

| Built with                     | `build/server/index.js` contains                       |
| ------------------------------ | ------------------------------------------------------ |
| _(nothing)_                    | `var isExternalApiEnabled = () => {` … `return false;` |
| `VITE_API_URL=http://host/api` | `var isExternalApiEnabled = () => {` … `return true;`  |

So **setting `VITE_API_URL` for `react-router-serve` does nothing** if the
bundle was built without it. There is no error: the folded self-hosted path
still works, and the deployment quietly keeps reading its own database. The
variable has to be present **for the build**:

```bash
VITE_API_URL=https://api.example.com/api vp run build
vp run start
```

Check which way a bundle actually folded, rather than trusting the environment.
**Both halves of the command below are load-bearing** (#708). The path is
repo-root-relative, because the bundle is written inside this app workspace, not
at the repo root — the bare `build/server/index.js` the earlier form named
resolves to nothing from the directory these docs tell you to run commands in.
The `^` anchor is what makes it a probe rather than an echo: the bundler
preserves the docblock above `isExternalApiEnabled` verbatim into the output,
including the command itself, so dropping the anchor matches the documentation
before it matches the code and reports the same first line whichever way the fold
went. Remove the `^` and see it for yourself.

```bash
grep -n -A2 '^var isExternalApiEnabled' apps/showcase/build/server/index.js
```

The same anchored read answers the sharper question, which host the loader will
actually call, because `getApiBaseUrl` folds too — with the variable set it
collapses to a single `return "<the value>";` with the `requestUrl` branch
eliminated:

```bash
grep -n -A3 '^var getApiBaseUrl' apps/showcase/build/server/index.js
```

In **dev** there is no prebuilt bundle, so exporting the variable before the dev
server is enough:

```bash
vp run db:up
VITE_API_URL=http://localhost:3001/api vp run dev:showcase
```

and the self-hosted default:

```bash
vp run db:up
vp run dev:showcase        # showcase alone
```

### Keeping the override honest

An override nobody runs is an override that breaks silently, so it is exercised
three ways: by exporting `VITE_API_URL` by hand;
`services/isExternalApiEnabled.util.test.ts` plus each fetcher's test in CI,
which stub `VITE_API_URL` and assert the request URL each branch produces
**including with an SSR `requestUrl` present**; and, in the package that now
owns the precedence, the `precedence: VITE_API_URL outranks the request URL`
block in `packages/api/src/config/get-api-base-url.util.test.ts`. Deleting any
of them leaves the branch less watched than it reads.

**Point it somewhere the fallback would never reach.** The obvious value,
`VITE_API_URL=http://localhost:3001/api`, is convenient and useless as a check:
it is byte-identical to what `getApiBaseUrl` answers for a local request URL
anyway, so a request arriving at that server proves nothing about which of the
two produced the address. It hid a real defect for two rounds of review
on #701, and #705 is the issue that settled it. To actually test the override,
point it at a host nothing else uses — a stub server on a spare port — and
assert the request lands _there_ while a **live** server on `:3001` stays idle.
The second server matters as much as the first: without it, the wrong host
produces a connection error, and "the override worked" and "the page broke" stop
looking different.

Note what the unit tests can and cannot show: they run under Vitest, where
`import.meta.env` is live, so they prove **the branch and the host are wired
correctly**. That a given _deployment_ took it is a property of how that
deployment was built, and the `grep` above is what answers it.

`enterprise-orders` has no override. It never had an external path worth keeping
— it was self-hosted from the start.

### Where the two paths disagree

One case, and it is documented rather than fixed here: sorting
`wide_alltypes_150.c_018` (`point`). The external endpoint answers `400` and the
route renders its error boundary; the self-hosted one drops the unorderable term
and answers a normal page ordered by the fallback key. The column's header is
clickable either way.
