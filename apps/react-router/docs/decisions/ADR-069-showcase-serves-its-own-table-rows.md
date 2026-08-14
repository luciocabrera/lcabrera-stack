# ADR-069 — The showcase serves its own table rows; an external API is an opt-in override

**Status:** Accepted

- **Date:** 2026-08-14
- **Scope:** `apps/react-router` — the four table routes, their `.server`
  services, their `_api/…/paginated` resource routes, and `src/services/`
- **Issue:** #687 (under #686)
- **Related:** [ADR-038](../../../../docs/decisions/ADR-038-public-package-topology-by-runtime.md)
  (runtime split), [ADR-039](../../../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md)
  (duplicate over an undeclared edge),
  [ADR-056](../../../../docs/decisions/ADR-056-generic-table-route-data-path.md)
  (one generic data path), [ADR-063](../../../../docs/decisions/ADR-063-request-shaping-capabilities-on-the-loader-meta.md)
  (capabilities on the loader meta)

## Context

This app is the showcase for the `@lcabrera/*` packages. Three of its four table
route families — `car-sales`, `car-sales-infinite`, `wide-alltypes-150` — read
their rows over HTTP from `car-sales-api`, a separate workspace listening on
`localhost:3001`. The fourth, `enterprise-orders`, does not: it reads Postgres in
its own process through a `.server` service and serves its own load-more from a
resource route.

Two things made that split untenable.

The API servers are leaving this repository (#686). Whatever depends on them
stops rendering the day they go, and "run a second repository first" is a poor
first impression for a showcase whose whole job is to be looked at.

The self-hosted route was also simply better, and had been for a while. It has
one fewer process, one fewer network hop on the SSR path, no CORS story, and no
proxy configuration — `enterprise-orders` had already been moved to it once,
because the `bff` filter-options transport failed CORS under a bare
`react-router-serve` production build (#340) while the same-origin one did not.

## Decision

**Every table route in this app reads Postgres in this process by default.**
`car-sales`, `car-sales-infinite` and `wide-alltypes-150` adopt the shape
`enterprise-orders` already had, piece for piece:

| Piece                   | Where                                                  |
| ----------------------- | ------------------------------------------------------ |
| Entity configuration    | `routes/<route>/config/` — plain data, no SQL, no `pg` |
| Postgres access         | `routes/<route>/.server/<entity>.service.ts`           |
| First page (SSR)        | the route's `loader`, calling that service directly    |
| Later pages (load-more) | `_api/<entity>/paginated`, calling the same service    |
| Browser fetcher         | `services/<entity>.api.ts`, same-origin                |

The column lists in those `config/` modules are **copied, not imported**, from
`apps/shared`. That is ADR-039 applied unchanged: this app may not take a runtime
dependency on `api-shared`, and after #686 it will not be able to.

**`VITE_API_URL` remains an override, and it is real rather than vestigial.**
Set it and the same routes fetch from the external API instead — the loader
through `readCarSalesPage` / `readWideAlltypes150Page`, the browser through the
matching fetcher. One predicate decides,
`services/isExternalApiEnabled.util.ts`, and it is read per call rather than
captured at module scope so both branches are reachable from a test.

**Both sources answer byte-identical responses.** Each converted endpoint keeps
the shape its external counterpart returned, field for field:
`{ data, hasMore, total }`, with `total` on **every** page rather than only the
first. That last part is a deliberate refusal of the cheaper read
`enterprise-orders` uses: `skip === 0`-only counting changes the response shape,
and these two tables read a total from every page.

Matching the shape takes one step that has nothing to do with SQL. A `date`
column arrives from the driver as a `Date`; the resource route's `Response.json`
renders it as an ISO string and React Router's single fetch does not — it revives
a `Date` as a `Date`. So the **service**, not the transport, applies the JSON
rendering (`toCarSaleRow`, `toWideAlltypes150Row`), and the SSR page and the
load-more page cannot arrive in different shapes.

## Consequences

- **The showcase runs on a database and nothing else.** `vp run dev:showcase`
  is the whole command; `vp run db:up` is the whole prerequisite.
- **The SSR first page no longer pays for a network hop**, and no route depends
  on the Vite dev proxy or on any CORS configuration.
- **Two column lists now exist for `car_sales` and two for `wide_alltypes_150`**
  — one here, one in `apps/shared` — and nothing checks that they agree. That is
  the accepted cost of ADR-039, and it is temporary in this instance: the copy in
  `apps/shared` leaves with #686. The colocated constants tests do check each
  app-local list against the columns its own table actually renders, which is the
  drift that would break a page.
- **The override is a code path most runs do not take**, which is exactly how one
  rots. It is therefore exercised two ways: `vp run dev:external-api` by hand,
  and unit tests that stub `VITE_API_URL` and assert the URL each branch builds.
  Deleting either leaves the branch unwatched.
- **`car-sales-api` is no longer part of rendering this app.** `vp run dev` still
  starts it; it now serves the override and `apps/admin_system` only.
- **A page is now bounded by this process's connection pool** rather than by a
  separate server's. The pool is `@lcabrera/server`'s singleton, shared with the
  enterprise-orders routes and the filter-options service.

## Alternatives considered

**Point the loaders at the app's own resource routes over HTTP.** Uniform, and
much the smaller diff: one base URL changes and nothing else. Rejected because it
keeps the network hop on the SSR path for no benefit — the loader and the
resource route run in the same process, so the request is the app calling
itself — and because `enterprise-orders` had already demonstrated the direct
call, which means this option would have left two shapes in the app rather than
one.

**Import the column lists from `api-shared` instead of copying them.** Rejected
by ADR-039 before this issue existed: the edge is undeclared, and it is about to
be unresolvable. The comment in `enterpriseOrders.constants.ts` records the same
shortcut being considered and rejected there.

**Drop `VITE_API_URL` entirely.** The simplest thing that satisfies #686, and
tempting: an override nobody runs is dead code. Rejected because the external
path is a real deployment topology for a library consumer, and because the
`@lcabrera/api` fetch layer — `createPaginatedFetcher`'s `resolveBaseUrl`
strategy, `getApiBaseUrl` — is product that would lose its only in-repo exercise
along with it. Keeping it costs one predicate and two tests.

**Adopt the `skip === 0`-only `COUNT` while converting.** It is the cheaper read
and the pattern the repo already prefers (#402). Rejected here because it removes
`total` from later pages, which is a response-shape change on top of a source
change — two things failing at once, with nothing left to compare against once
the external endpoints are gone. It stays available as its own change.

## References

- Issue #687 — self-host the car-sales and wide-alltypes routes; #686 — move the
  API servers out
- `apps/react-router/docs/data-sources.md` — the current map of both paths
- The captured before/after endpoint responses that establish field-for-field
  parity are in the PR for #687
