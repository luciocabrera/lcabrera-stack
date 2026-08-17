# @lcabrera/api

## 0.3.0

### Minor Changes

- 5af634d: **Breaking: `getApiBaseUrl` now ranks `VITE_API_URL` above the SSR request URL.**

  Through `0.2.0` the request URL came first and returned inside its own branch, so
  `VITE_API_URL` was unreachable whenever a loader supplied one:

  ```ts
  // before — the variable is never read on this path
  getApiBaseUrl('https://app.example.com/orders'); // → 'https://app.example.com/api'

  // after
  getApiBaseUrl('https://app.example.com/orders'); // → the VITE_API_URL value
  ```

  The argument is not that explicit configuration ought to beat inference on
  principle. It is that only _half_ a render can supply a request URL: a loader has
  one and the browser does not. Ranking it first therefore made a single page
  resolve two different API hosts depending on which half asked — silently, because
  the SSR half rendered fine against the request's own origin. An override that
  applies to one half of a render is worse than one that does not apply at all.

  `requestUrl` keeps the job it actually had. Under SSR there is no `location` to
  read, so it remains the only way a deployed app can learn the origin it is being
  served from — it is still priority 2, ahead of both fallbacks, and unchanged when
  no override was built in.

  **Who this breaks.** You, if you set `VITE_API_URL` for the browser half of an app
  while relying on same-origin resolution for its loaders. That combination now
  sends both halves to the variable's host. **Fix:** do not set `VITE_API_URL` for
  that build. It is substituted by Vite at build time, so it is a build input rather
  than a runtime switch, and no argument to this function overrules it — an app
  needing both behaviours from one bundle has to choose between them itself and pass
  an explicit base URL. If you only ever set the variable for a fully external API,
  or never set it at all, nothing changes for you.

  `minor` rather than `major` because this package is pre-`1.0`, where the minor
  slot is the breaking one (SemVer §4) and a `major` would assert a `1.0.0` API
  commitment this change is not entitled to make on its own. The change is breaking
  regardless of the slot it lands in; `@lcabrera/ui@0.2.0`'s `retire-dead-table-seams`
  release is the precedent for saying so in the changelog rather than in the number.

  The order is pinned in both directions by tests, using an override host no other
  branch of the function can produce — the probe that let this survive a review, a
  verification and a round of fixes used `http://localhost:3001/api`, which is
  byte-identical to what the function answers for a local request URL.

- e8cc16d: One generic data path for a paginated table route, replacing three hand-written
  copies of it (ADR-056).

  **`@lcabrera/api`** gains `createPaginatedFetcher` (`@lcabrera/api/http/create-paginated-fetcher.util`)
  and the shared paginated-read contract (`@lcabrera/api/http/http.types`:
  `PaginatedSort`, `PaginatedQuery`, `PaginatedFetchArgs`). The factory takes a
  path, a required response type guard and an optional base-URL strategy, and
  returns a fetcher; it composes the existing `buildPaginatedQueryParams` and
  `fetchAndValidate` and adds no HTTP behaviour of its own. The guard is required
  because an unvalidated page is a cast, and a wrong cast surfaces as a render
  crash several layers from the response that caused it.

  **`@lcabrera/ui`** gains the view-side counterpart to `createTableRouteLoader`:

  - `TableRouteView` — a whole table route's view. Reads the loader data, wires
    load-more, defaults `dataSelector`/`dataTotalSelector`, renders `TableLayout`.
  - `useTableRoutePage` — the same wiring without the JSX, for a route that needs
    its own markup around the table.
  - `buildTablePageQuery` and `toKeysetCursorValues`
    (`@lcabrera/ui/routing/shared`) — the client-side mirror of the sort
    composition `createTableRouteLoader` performs server-side.
  - `TableRouteLoaderData` (from `createTableRouteLoader.util`) and
    `TablePageResponse` (from the root barrel).

  `filter` and keyset `cursor` are **opt-in**, defaulting to off, because they
  describe what the endpoint understands. Sending a `cursor` an endpoint ignores
  is noise; sending a `filter` it ignores appends unfiltered rows to a filtered
  table. Both are declared on the loader `meta` as `isServerFilterEnabled` and
  `isKeysetEnabled` (ADR-063) — see the entry for that change in this release.

  Additive only — every existing export keeps its signature. One internal
  correctness fix rides along: `readTableLoaderStateFromRequest` was casting
  `columnOrder`/`columnVisibility` to `keyof TData` where every sibling cast used
  the proper state type, so both now use `ColumnOrderState`/`ColumnVisibilityState`.

### Patch Changes

- Updated dependencies [8bb2a24]
  - @lcabrera/utils@0.2.0

## 0.2.0

### Minor Changes

- fbf9d05: `buildPaginatedQueryParams` accepts an optional `cursor` — the sort-key tuple of
  the last row already loaded — and serializes it as a `cursor` search param for
  endpoints that can seek past it instead of counting `skip` rows. `skip` is still
  sent alongside, so an endpoint that does not read cursors behaves exactly as
  before.

## 0.1.1

### Patch Changes

- 287eb48: Add and update package READMEs.

  npm renders `README.md` as the package page, and `@lcabrera/api`,
  `@lcabrera/server` and `@lcabrera/ui` had none — all three pages were empty. Each
  now covers what the package is, how to install it, every subpath export, and
  worked examples.

  `@lcabrera/ui`'s leads with the constraint a consumer hits first: it ships
  TypeScript source rather than a compiled bundle, so the bundler must compile it
  and run StyleX over it.

  `@lcabrera/utils`'s install step told readers to use `workspace:*`, which only
  resolves inside this repo; its export table had also drifted four entries behind
  the `exports` map.

  A README only reaches npm with a release, so this is a patch across all four.

- Updated dependencies [287eb48]
  - @lcabrera/utils@0.1.1

## 0.1.0

### Minor Changes

- First public release.

  `@lcabrera/ui` ships React 19 components — Table, Form, Modal, Tooltip and the
  rest — styled with StyleX and built for React Router 7 loaders and actions.
  `@lcabrera/api` is the browser-safe fetch layer, `@lcabrera/server` the Node-only
  Postgres and crypto helpers, and `@lcabrera/utils` the pure helpers underneath
  both.

  These target one stack deliberately: React 19, React Router 7, StyleX, the React
  Compiler, and `pg` on the server. They are not framework-agnostic and do not try
  to be.

  `api`, `server` and `utils` are published as compiled `dist` with type
  declarations. `ui` ships TypeScript source on purpose — StyleX derives every
  custom-property name from the source path, so a consumer's own StyleX plugin has
  to compile it.

### Patch Changes

- Updated dependencies
  - @lcabrera/utils@0.1.0
