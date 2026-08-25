# ADR-070 — The showcase serves its own table rows; an external API is an opt-in override

**Status:** Accepted — one rejected alternative has since been adopted (#705)

> **Amendment, #705.** "Reorder the priorities inside `@lcabrera/api`'s
> `getApiBaseUrl`" is listed below under _Alternatives considered_ and was
> rejected here as the wrong home, needing its own issue and a changeset. It got
> both: `VITE_API_URL` now outranks the SSR `requestUrl` inside the package, so
> `resolveExternalApiBaseUrl` and `readExternalApiUrl` no longer exist and the
> fetchers pass `getApiBaseUrl` directly. Every mention of those two utils below
> is a dated record of the shape this ADR shipped, not current structure. What
> this ADR actually decided — the showcase self-hosts, `VITE_API_URL` is an
> opt-in build-time override, `isExternalApiEnabled` is the switch — is
> unchanged.
>
> **Amendment, #708.** One recipe below is wrong as written, in two ways, and was
> wrong on the day. The body's
> `grep -A2 'isExternalApiEnabled = () => {' build/server/index.js` names a path
> that does not exist from the repo root — the bundle is at
> `apps/react-router/build/server/index.js` — and its pattern is unanchored,
> which matters because the bundler preserves the `isExternalApiEnabled` docblock
> verbatim into the output, command and all. On the tree this ADR shipped with,
> that docblock quoted the unanchored form, so running it matched its own
> documentation and printed the same lines whichever way the predicate folded.
> The corrected form —
> `grep -n -A2 '^var isExternalApiEnabled' apps/react-router/build/server/index.js`
> — is carried verbatim by `docs/data-sources.md` and by the
> `isExternalApiEnabled` docblock, and the anchor is still what separates the
> code from the comment quoting it.
>
> **The same body sentence's cross-reference is stale in its own right**, and it
> is worth naming separately because it is a claim about another document rather
> than about a command. It reads "`docs/data-sources.md` carries it", where "it"
> is the wrong command quoted immediately before. That document carries the
> corrected form above instead, so a reader who follows the pointer will not find
> what the body says is there — and could reasonably conclude that
> `data-sources.md` had drifted rather than that this line had.
>
> The body below is left as written, per the ADR-008 precedent of correcting a
> dated record from its header rather than rewriting it.

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
the external API's domain layer. That is ADR-039 applied unchanged: this app may
not take a runtime dependency on it, and it no longer could.

**`VITE_API_URL` remains an override, and it is a _build-time_ one.** Set it and
the same routes fetch from the external API instead — the loader through
`readCarSalesPage` / `readWideAlltypes150Page`, the browser through the matching
fetcher. One predicate decides,
`services/isExternalApiEnabled.util.ts`.

Two utils split that decision — `isExternalApiEnabled` for **whether**,
`resolveExternalApiBaseUrl` for **where** — because the second question has an
answer the package would get wrong. `getApiBaseUrl` ranks the SSR request URL
above `VITE_API_URL`, so a loader handing it one gets the request's own origin
and the variable is never read; the browser, which passes no request URL, gets
the override. The two halves of a route would talk to different hosts. The app
inverts that order for itself.

The build-time part is not an implementation detail to be glossed. The predicate
reads `import.meta.env.VITE_API_URL`, which Vite substitutes when the bundle is
produced, so a production build folds it to `return false;` or `return true;`
and eliminates the losing branch. **Setting the variable for
`react-router-serve` against a bundle built without it changes nothing, and says
nothing** — the folded self-hosted path still works, so the deployment silently
keeps reading its own database. It must be set for the build:
`VITE_API_URL=… vp run build`. In dev there is no prebuilt bundle and exporting
it is enough, which is all `vp run dev:external-api` does.

Reading the variable per call rather than capturing it at module scope is what
keeps both branches reachable **from a test**, where `import.meta.env` is live
and `vi.stubEnv` can move it. It buys nothing in a build, where either spelling
folds identically — and claiming otherwise is what would make the paragraph
above wrong.

**Both sources answer byte-identical responses, with one deliberate exception.**
Each converted endpoint keeps the shape its external counterpart returned, field
for field: `{ data, hasMore, total }`, with `total` on **every** page rather than
only the first. The exception is a request asking for more rows than
`MAX_CAR_SALES_LIMIT`: the replaced endpoint served it, and this one clamps.
Preserving an uncapped `?limit=` on a public, unauthenticated URL over a 500k-row
table was not worth the parity, and the deviation is stated rather than
smuggled. That last part is a deliberate refusal of the cheaper read
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
  — one here, one on the API side — and nothing checks that they agree. That is
  the accepted cost of ADR-039, and it was temporary in this instance: the other
  copy left with the API. The colocated constants tests do check each
  app-local list against the columns its own table actually renders, which is the
  drift that would break a page.
- **The override is a code path most runs do not take**, which is exactly how one
  rots. It is therefore exercised two ways: `vp run dev:external-api` by hand,
  and unit tests that stub `VITE_API_URL` and assert the URL each branch builds.
  Deleting either leaves the branch unwatched.
- **The override cannot be flipped on a running deployment**, and that is a cost
  rather than a detail. Pointing a deployed showcase at the extracted API is a
  rebuild, not a restart, and the failure mode of getting it wrong is silence.
  `grep -A2 'isExternalApiEnabled = () => {' build/server/index.js` is what
  tells a bundle's two states apart; `docs/data-sources.md` carries it. A
  runtime switch was not built because the browser half cannot read `process.env`
  — it would send the loader external while the load-more stayed self-hosted,
  which is a worse failure than the one it replaces.
- **The external API is no longer part of rendering this app.** `vp run dev` still
  starts it; it now serves the override only.
- **A page is now bounded by this process's connection pool** rather than by a
  separate server's. The pool is `@lcabrera/server`'s singleton, shared with the
  enterprise-orders routes and the filter-options service.
- **Every request-derived number reaching SQL is now bounded**, on both
  converted endpoints: `limit` in each resource route's parser, sort-term count
  in each service (so the SSR path is covered too), and column identifiers by
  the builder's `allowedColumns`. Two of those bounds did not exist on the
  endpoints being replaced and two were missing from the first version of this
  change — the asymmetry between the two new parsers is what review caught
  (#701). `skip` is deliberately unbounded: an offset past the table returns an
  empty page after work bounded by the table rather than by the request.
- **The two paths are interchangeable except on one request**: a sort naming
  `wide_alltypes_150.c_018` (`point`). The external endpoint rejects it with a
  `400` and the route renders its error boundary; this one drops the unorderable
  term and answers a page on the fallback key. The forgiving direction was
  chosen, but it is a behavioural difference and the header offering the sort is
  the underlying defect — narrowing `isSortable` changes what the route renders
  and so belongs in its own change (#687 §5). Recorded in that route's
  `ARCHITECTURE.md`.

## Alternatives considered

**Point the loaders at the app's own resource routes over HTTP.** Uniform, and
much the smaller diff: one base URL changes and nothing else. Rejected because it
keeps the network hop on the SSR path for no benefit — the loader and the
resource route run in the same process, so the request is the app calling
itself — and because `enterprise-orders` had already demonstrated the direct
call, which means this option would have left two shapes in the app rather than
one.

**Import the column lists from the API's domain layer instead of copying them.** Rejected
by ADR-039 before this issue existed: the edge is undeclared, and it is about to
be unresolvable. The comment in `enterpriseOrders.constants.ts` records the same
shortcut being considered and rejected there.

**Drop `VITE_API_URL` entirely.** The simplest thing that satisfies #686, and
tempting: an override nobody runs is dead code. Rejected because the external
path is a real deployment topology for a library consumer, and because the
`@lcabrera/api` fetch layer — `createPaginatedFetcher`'s `resolveBaseUrl`
strategy, `getApiBaseUrl` — is product that would lose its only in-repo exercise
along with it. Keeping it costs three small utils and their tests.

**Reorder the priorities inside `@lcabrera/api`'s `getApiBaseUrl`.** That
function ranks the SSR request URL above `VITE_API_URL`, which is what made the
override select the external branch while the request still went to the
request's own origin. Rejected as the wrong home rather than the wrong fix: the
priority list is published behaviour for every consumer of the package, so
changing it needs its own issue, its own justification and a changeset.
`resolveExternalApiBaseUrl` inverts the order for this app in four lines and
leaves the package's contract alone.

**Adopted since, in #705.** The issue, the justification and the changeset all
exist, and the reorder landed in `@lcabrera/api`. The app-side inversion was
deleted in the same change — see the amendment at the top of this file.

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
