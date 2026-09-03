# @lcabrera/api

## 0.4.2

### Patch Changes

- 62bb601: Stop shipping documents a consumer cannot read, and gate the recurrence.

  `@lcabrera/ui`, `@lcabrera/server` and `@lcabrera/utils` shipped the whole
  markdown set beside their source — every `ARCHITECTURE.md`, the artifact
  inventory, the pattern guide. Those are written for a reader who has the
  repository cloned: in an install they are pages of relative links to a decisions
  directory that is not in the tarball, plus decision citations by bare number.
  `files` now carries `"!src/**/*.md"`, so the source arrives without them and the
  README states what a consumer needs, linking the rest by absolute URL.

  Every other published package carries the same negation for whichever directory
  it publishes its source from — `src`, or `scripts` for the two `.mjs` packages.
  It is inert in each of them today and changes nothing that ships, which a
  before/after comparison of every packed file list confirms. It is there
  because it is the only guard that makes a newly added `src/ARCHITECTURE.md`
  fail to ship outright, rather than merely be likely to trip the content gate on
  its way out. `@lcabrera/devkit`'s `assets` are the deliberate exception: that
  markdown is what the package exists to copy.

  `@lcabrera/repo-standards` adds `repo-verify-shipped-docs`, which packs each
  package named in `publishing.publicPackageDirs` and reads the markdown back out
  of the tarball — `files` decides its corpus, not the working tree, which is the
  only way to see a negated pattern at all. It reports a relative link that leaves
  the package, a link to a file the package does not ship, a path anchored at one
  of the author repository's own directories (`gates.shippedDocs.repoOnlyDirs`,
  defaulting to the conventional monorepo layout), and a decision cited with no
  absolute URL on the line. An empty package roster, and any package that ships no
  readable document, are refused rather than passed.

  The remaining published READMEs stop naming the repository's own tree in
  passing: the source directory each package lives in is now a link a reader can
  open.

- a26ff71: Remove the comments a declaration's name, signature and types already state,
  from every package source.

  Nothing about behaviour changes, but the removal is visible in an editor: a
  declaration's JSDoc is carried into the published `.d.mts`, so a tooltip that
  used to show a paragraph now shows the signature. What the paragraph said lives
  where it is dated — the ADR that owns the decision, or the pull request that
  made it — and the annotations a build reads (`@param`, `@returns` and the rest,
  in the JavaScript sources that ship them) are untouched, as are the one-line
  notes on a member of an exported type, which reach an installer and state what
  the member's own type cannot.

  Four declarations changed shape rather than only losing prose, because their
  only body was a comment and removing it left an empty block: `getApiBaseUrl`
  resolves a request URL through a helper instead of swallowing the parse in an
  empty `catch`, `parseVersionedPayload` and `collectPersistedStateSlices` return
  and `continue` explicitly, and the logger's no-op is an expression. Each behaves
  as it did. `collectPersistedStateSlices` also drops its `transformRaw`
  parameter, which every caller filled with the percent-decode
  `parseVersionedPayload` already performs.

  Two union member orders moved with them — `TableResponseError`'s arms and
  `AggregateItem`'s intersection — because the sort those rules apply reads the
  member's source text, and the text no longer carries a comment. A union is
  unordered to a consumer.

- Updated dependencies [62bb601]
- Updated dependencies [a26ff71]
  - @lcabrera/utils@0.2.2

## 0.4.1

### Patch Changes

- 55211d7: Point `homepage`, `bugs` and `repository.url` at the repository's new name.

  The old URLs still resolve — GitHub redirects them — but only while the old name
  stays unregistered, and a published version's metadata can never be corrected in
  place. Every already-published version keeps the old URL permanently, so this is
  the first release whose links are right on their own.

  `@lcabrera/eslint-plugin` also changes what it prints into a consumer's lint
  output. ESLint shows `meta.docs.url` beside every finding, and none of the ten
  rules had a URL that resolved: eight emitted `https://example.com/rule/<name>`,
  the placeholder the first rule was scaffolded from, and two pointed at a
  `/rules/<name>` path this repository has never had. All ten now link to the
  rule's own section in the package README, which does exist, and they build that
  link from one shared factory instead of ten copies — the copies are what let
  eight of them drift.

- 9f1cc03: JSDoc on exported types is shorter. Signatures are unchanged. Comments that only
  restated a name are gone; traps and invariants stay on the line they govern
  (ADR-088).
- Updated dependencies [55211d7]
- Updated dependencies [9f1cc03]
  - @lcabrera/utils@0.2.1

## 0.4.0

### Minor Changes

- ae3022a: A date or timestamp column can now be a group key at a chosen granularity —
  year, quarter, month or day — instead of being refused for holding one value per
  calendar day.

  ```ts
  await selectGroupedRows({
    aggregates: [{ fn: 'count' }, { column: 'total_amount', fn: 'sum' }],
    allowedColumns: ['order_date', 'total_amount'],
    grouping: 'rollup',
    keys: ['order_date'],
    maxRows: 5000,
    periods: { order_date: 'month' }, // ← new
    schema: 'public',
    table: 'orders',
  });
  ```

  The granularity is a **column-keyed map beside** the key list, not a member of
  it: a column can be a group key at most once, so a map is per-key by
  construction and `keys` stays `readonly string[]` in both packages, in the URL
  and in every group path. `OlapGroupPeriod` lives in `@lcabrera/api` and both
  other packages alias it — it travels in two params, so it is wire vocabulary.

  **`ColumnGroupingCapability` gains `periods`, and it is independent of
  `canGroup`.** A date column is routinely refused as a raw key and legal at a
  month, so read `periods` _instead of_ `canGroup` for a temporal column rather
  than after it:

  ```ts
  { column: 'order_date', typeName: 'date', role: 'dimension',
    canGroup: false, refusal: 'too-many-distinct', distinctEstimate: 1800,
    periods: ['month', 'quarter', 'year'] }
  ```

  The cardinality guard measures the **truncated** expression. `pg_stats` has no
  distinct count for `date_trunc('month', c)`, so the capabilities query now reads
  the column's histogram range and the estimate is bounded by both that range and
  the raw distinct count.

  **Truncation is performed in a stated time zone.** `date_trunc(field,
timestamptz)` resolves against the session `TimeZone`, so the same order falls in
  December for one caller and January for another. `timestamptz` keys are pinned to
  UTC; `date` and `timestamp` are cast so the call cannot promote them through the
  session zone.

  **Drilling a truncated group is a half-open range**, `gte` the period start and
  `lt` the next — the group's value is a period start no row holds, so an equality
  returns the boundary row alone. `toDrillRead` takes a new `truncations` argument
  for this; `toGroupKeyTruncations` builds it from the capabilities. `toGroupRow`
  and `decodeGroupedRows` take the same argument, and use it to head a period group
  `2021-06` rather than with an ISO instant.

  In `@lcabrera/ui`, an applied temporal key in the settings drawer carries a
  granularity control offering exactly the periods the route reports. The
  `grouping` URL param gains a `gran` member beside `agg`; it is dropped when
  empty, so an untruncated grouping produces the link it always did.

  **Breaking for anyone constructing these types by hand.**
  `ColumnGroupingCapability.periods` and `TableGroupingState.periods` are required
  rather than optional — a surface that omitted one would silently offer nothing.
  Values produced by `getColumnGroupingCapabilities` and the loader are unaffected.

- dd82183: The OLAP seam is now part of the packages, so a consumer no longer has to write
  it.

  Grouping, rollup, cube and drill are features of a table in the same sense that
  sorting and filtering are, but the code joining the query engine to the grid had
  to be written by the consuming app: how to decode a grouped read, and how to turn
  a group row back into a query for the rows underneath it. Both are now shipped
  (ADR-082).

  **`@lcabrera/server` gains `db/olap/`.**

  - `toGroupRow` turns one row of a grouped read into the group summary a grid
    renders, decoding the `GROUPING()` mask — the only thing that separates a
    subtotal from a genuine NULL, since the two are textually identical. It sits
    beside `build-group-query`, which is what writes that mask.
  - `toDrillRead` turns a group row into the paginated read of the rows underneath
    it, carrying four rules that are easy to get wrong and quiet when they are: the
    grouped view's filters are inherited unchanged, a NULL key becomes `IS NULL`
    rather than an equality that is never true, group-key terms come out of the
    sort while the primary key goes in as a tiebreaker, and the read carries no
    grouping — which would otherwise return group rows again. It answers a typed
    refusal for a grand total, a subtotal or an incomplete path rather than an
    empty page.
  - `toGroupLabel` formats a group key against the closed dimension vocabulary.

  Your route supplies its own primary key and page ceiling, and nothing else.

  **`@lcabrera/api` gains `olap/`** — the wire codec for a drill request.
  `encodeDrillGroup` and `parseDrillGroup` are two halves of one thing and now live
  together, so a browser encoder and a server parser cannot drift apart. It also
  carries `OLAP_GROUP_ROW_FIELD`, the row field a grouped read attaches its summary
  to, which `@lcabrera/ui` re-declares as `TABLE_GROUP_ROW_FIELD`.

  **`@lcabrera/server` now depends on `@lcabrera/api`.** The dependency runs
  Node → browser-safe, which is the harmless direction: `@lcabrera/api` declares no
  dependencies of its own, so nothing new enters your graph.

  No existing API changed.

### Patch Changes

- @lcabrera/utils@0.2.0

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
