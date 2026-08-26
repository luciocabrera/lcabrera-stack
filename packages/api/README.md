# `@lcabrera/api`

**Browser-safe** HTTP building blocks: resolving an API base URL across the
environments a React SSR app actually runs in, fetching JSON and validating it
before it reaches your types, and paging a distinct-values endpoint for filter
dropdowns.

No Node, no database driver, no framework. It runs in a browser, in a service
worker, and during SSR — and the TypeScript config enforces that rather than
trusting it: `types` omits `node`, so a stray `process` or `fs` reach-in fails
typecheck in CI.

## Install

```bash
npm install @lcabrera/api
```

No peer dependencies. `@lcabrera/utils` comes along as a regular dependency.

## Why it exists

This package used to be half of `@lcabrera/server`. The two halves — browser
`fetch` helpers and Node/Postgres access — sat together because nothing depended
on only one of them, until `@lcabrera/ui` came to need exactly two helpers from
it. That meant every consumer of a **UI component library** was installing the
Postgres driver.

Splitting on runtime removes that at the package boundary instead of papering
over it, and the split is enforced from both sides: this package's tsconfig
denies Node globals, and `@lcabrera/ui`'s publish gate fails if anything in its
dependency closure contains a `node:*` import.

## Exports

Every helper is a separate subpath — no barrel — so you pull in exactly what you
use and tests mock a module rather than a barrel.

| Import                                                    | What it does                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@lcabrera/api/http/fetch-and-validate.util`              | Fetch → assert OK → parse JSON → validate through a type guard, with a timeout  |
| `@lcabrera/api/http/build-paginated-query-params.util`    | Builds the shared `limit`/`skip`/`sort`/`filter` query string                   |
| `@lcabrera/api/http/create-paginated-fetcher.util`        | Factory: endpoint declaration in, validated page fetcher out                    |
| `@lcabrera/api/http/http.types`                           | `PaginatedSort`, `PaginatedQuery`, `PaginatedFetchArgs`                         |
| `@lcabrera/api/config/get-api-base-url.util`              | Resolves the API base URL across SSR, dev-proxy, private-IP and production      |
| `@lcabrera/api/config/config.constants`                   | `API_SERVER_PORT` and the `CONFIG` per-environment host map                     |
| `@lcabrera/api/config/config.types`                       | `ApiConfig` — the shape of `CONFIG`                                             |
| `@lcabrera/api/distinct/fetch-distinct-values.util`       | Pages a distinct-values endpoint (the HTTP half of a filter-options descriptor) |
| `@lcabrera/api/distinct/is-distinct-values-response.util` | Type guard for `DistinctValuesResponse`                                         |
| `@lcabrera/api/distinct/parse-filter-options-params.util` | Parses filter-option search params into `fetchDistinctValues` arguments         |
| `@lcabrera/api/distinct/distinct.types`                   | `DistinctValuesResponse` — the wire contract                                    |

## Usage

### Fetch something and know what you got

`fetchAndValidate` refuses to hand back a value it has not checked. The guard is
yours, so the validation library is your choice — or no library at all.

```ts
import { fetchAndValidate } from '@lcabrera/api/http/fetch-and-validate.util';

type Order = { readonly id: number; readonly total: number };

const isOrderList = (value: unknown): value is readonly Order[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'object');

const orders = await fetchAndValidate({
  isValid: isOrderList,
  shapeErrorMessage: 'Unexpected /orders response shape',
  timeoutMs: 10_000,
  url: '/api/orders',
});
```

It throws on a non-OK status, on unparseable JSON, and on a body the guard
rejects — so downstream code never has to re-check.

### Resolve the base URL you should be calling

The awkward part of an SSR app is that "where is the API" has a different answer
in the browser, on the server, behind a dev proxy, and on a LAN IP.
`getApiBaseUrl` encodes all of them; pass the request URL when you have one
(loaders, actions) and it derives the answer from the host actually being served.

```ts
import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';

export const loader = async ({ request }: { request: Request }) => {
  const baseUrl = getApiBaseUrl(request.url);
  // → dev proxy, localhost, same-host:3001, or the production host
};
```

**`VITE_API_URL` wins over every derived answer, including the request URL you
just passed.** Set it and this function returns it for every caller in that
bundle; leave it unset and the request URL, then the runtime, decide. The order
is that way round because only a loader can supply a request URL — the browser
half of the same render cannot — so ranking the request URL first made one page
resolve two different API hosts. If you want the request's own origin under SSR,
do not set `VITE_API_URL` for that build; Vite substitutes it at build time, so
there is no argument to this function that overrules it.

| Priority | Source                         | Answer                                        |
| -------- | ------------------------------ | --------------------------------------------- |
| 1        | `VITE_API_URL`                 | the value, verbatim                           |
| 2        | `requestUrl` (loader/action)   | localhost API host, or `<request origin>/api` |
| 3        | neither, and no `window` (SSR) | localhost API host                            |
| 4        | neither, in the browser        | dev proxy, `<host>:3001/api`, or same origin  |

### Fetch a page of table rows

Declare the endpoint once; the fetcher takes the query. The origin is a
per-fetcher strategy, not a per-call value — omit `resolveBaseUrl` for a
same-origin resource route, and pass `getApiBaseUrl` for one on the API host.
Only a loader supplies `requestUrl`, because only a loader has the SSR request.

```ts
import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';

export const fetchOrdersPage = createPaginatedFetcher<OrdersResponse>({
  isValid: isOrdersResponse, // required — an unvalidated page is a cast
  path: '/orders/paginated',
  resolveBaseUrl: getApiBaseUrl, // omit for a same-origin resource route
});

// In a loader — `requestUrl` is what the strategy resolves against:
await fetchOrdersPage({ limit: 50, requestUrl: request.url, skip: 0 });

// In the browser:
await fetchOrdersPage({ cursor, filter, limit: 50, skip: 50, sorting });
```

### Page a filter dropdown

```ts
import { fetchDistinctValues } from '@lcabrera/api/distinct/fetch-distinct-values.util';

const { hasMore, values } = await fetchDistinctValues({
  baseUrl: getApiBaseUrl(),
  columnName: 'country',
  limit: 50,
  offset: 0,
  tableName: 'orders',
});
```

## Guarantees

- **Browser-safe, enforced by the compiler** — no `node:*`, no `process`, no
  `fs`; the tsconfig omits Node types so a reach-in fails typecheck.
- **Explicit per-file subpaths, no barrel** — import the module you need.
- **Relative imports carry explicit `.ts` extensions**, so the package resolves
  under both bundler mode and `moduleResolution: NodeNext`.
- **Published as compiled ESM** (`.mjs` + `.d.mts`) with source maps and
  `"sideEffects": false`, mirroring the source tree one file per module.
- **95% coverage gate** — the build fails below it.

## Links

- [Repository](https://github.com/luciocabrera/lcabrera-stack) —
  `packages/api`
- [Changelog](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/api/CHANGELOG.md)
- Companion packages: [`@lcabrera/utils`](https://www.npmjs.com/package/@lcabrera/utils)
  (pure helpers), [`@lcabrera/server`](https://www.npmjs.com/package/@lcabrera/server)
  (the Node half), [`@lcabrera/ui`](https://www.npmjs.com/package/@lcabrera/ui)
  (React components)

MIT © Lucio Cabrera
