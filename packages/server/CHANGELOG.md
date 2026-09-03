# @lcabrera/server

## 0.6.0

### Minor Changes

- 38dd86c: A table can state a restriction it cannot change, and a view arrived at can open
  at its declared columns every time (ADR-094).

  **`@lcabrera/ui` gains `lockedFilters` on the loader `meta`.** Entries of
  `{ columnKey, label, value }` plus an optional `refusal`, rendered by the filters
  panel as its own section above the reader's own filters, with its own heading and
  count. It offers no control, so `Clear Filters` and `Reset Filters` cannot reach
  it and `Active Filters (n)` still counts only what a reader can take off. A
  restriction that could not be read renders its `refusal` rather than an empty
  list. `toLockedFiltersHeading` renders the same entries as one line for a surface
  with a title rather than a panel. Nothing here is a `ColumnFilter` and nothing
  derived from it narrows a read.

  **`@lcabrera/ui` gains `isColumnLayoutTransient` on the loader `meta`.** With it,
  `columnOrder`, `columnPinning`, `columnSizing` and `columnVisibility` are neither
  restored from the persistence cookie nor written to it, so the grid paints its
  declared columns in declared order on every request. The write half is part of the
  feature: without it a layout change costs a `Set-Cookie` and a header carried on
  every later request for state nothing reads, and the persistence action reports
  success for a write it did not make. Filters and sorting are untouched — they
  travel in the URL.

  Both are route-declared and re-asserted unconditionally by
  `createTableRouteLoader`, so the client-controlled UI-flags cookie can neither
  claim nor deny either one.

  `resolveLockedFilters` may answer synchronously or with a promise, and it is
  started alongside the grouping-capability resolver rather than after it. Whichever
  way either one fails — a throw where it stands, or a rejected promise — the loader
  rejects with the first failure while the other's promise stays attended, so a
  failing pair leaves no unhandled rejection behind.

  **Breaking, `@lcabrera/server`: `toGroupHeading` is replaced by
  `resolveGroupRestriction`,** at
  `@lcabrera/server/db/olap/resolve-group-restriction.util`. It answers the same
  request as a list — one `{ columnKey, label, value }` per group key, outermost
  first — instead of a joined string, and it refuses rather than returning nothing.
  It refuses on the same conditions as `resolveGroupRead`, in the same order and
  out of the same message map, so a surface stating the restriction and a surface
  rendering the refused page cannot say different things about one request. A
  caller that wants the old string joins the entries, or uses `@lcabrera/ui`'s
  `toLockedFiltersHeading`.

  Migration: replace

  ```ts
  toGroupHeading({ columns, params, truncations });
  ```

  with

  ```ts
  const restriction = await resolveGroupRestriction({
    columns,
    isGroupRequired: true,
    params,
    selectTruncations,
  });
  ```

  `truncations` is no longer passed in; `selectTruncations` is the same catalogue
  lookup `resolveGroupRead` already takes, and it is called only when the token
  carries granularities.

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
  - @lcabrera/api@0.4.2

## 0.5.0

### Minor Changes

- f8edbbc: **Breaking**, landing as a `minor` because `@lcabrera/ui` is pre-1.0 — while a
  package is `0.x` a break is a `minor`, never a `major` (see `packages/CLAUDE.md`).

  A group's rows now open in a **route** rather than being spliced underneath the
  group row. The inline drill is gone, and with it three props.

  **Removed from the public surface:**

  - `onDrillGroup` (`TableLayout`) and `fetchDrill` (`TableRouteView`,
    `useTableRoutePage`)
  - `isGroupDrillEnabled` (loader `meta`)
  - `TableGroupDrillFetcher`, `TableGroupDrillRequest`, and the drill row types
  - `toGroupKeyColumnFilter`, whose only consumer was the hand-off row

  **`@lcabrera/server` gains `resolveGroupRead`** — the whole decision of what a
  request that may name a group should read: token present or not, an unreadable
  one refused, the translation applied, the page positioned. A route supplies only
  its page ceiling, its tiebreaker column, and the catalogue lookup for a truncated
  key. It returns a read or a refusal carrying the sentence to render.

  `resolveGroupRead` takes `isGroupRequired` for a route that serves nothing but
  one group: there, an absent token is refused rather than read as the whole set.

  **`@lcabrera/server` also gains `toGroupHeading`** — the heading that route
  shows, read back out of the token. A truncated key is formatted as its period, so
  the heading reads `2021-06` like the group row that was clicked rather than the
  instant underneath it.

  **Added in their place:** `groupDetailsPath` on the loader `meta` — where the
  route serves one group's rows. A path rather than a callback, because a function
  does not survive the loader boundary and a path does, so the whole pair collapses
  into one declaration alongside every other capability. Absent means the
  affordance is not offered, so a route that declared neither is unaffected.

  The innermost key of a complete group row becomes a link carrying the group as a
  token plus every other search param; the route it opens reads them as its floor.
  The link is not a tab stop — `tabIndex={-1}` with `Enter` handled on the focused
  cell, the same rule the chevron follows, because the grid has exactly one tab
  stop addressed by row key plus column key.

  **Also added: `isUrlStateNested`.** A table rendering inside another table's
  route shares its URL, and the table's own sort and filters travel through that
  URL — it is the only channel its loader reads. Declared, every search param the
  table writes and reads carries a `nested.` prefix, so both tables own their state
  on one URL and neither re-filters the other. The group link seeds the nested
  params from the list's, which is the floor the group was computed under, so the
  route opens on exactly the set the count beside it described and a reader can
  narrow from there.

  Suppressing the write instead was tried and is wrong: the drawer would show the
  new filter and the grid would keep the old rows.

  **Why the shape changed rather than the drill being fixed.** The bounded page
  never paged again, so "show me this group's orders" was permanently truncated.
  The cost was not the fetch but the state around it: a four-member status per
  group, chrome rows that are neither summary nor data occupying real height in
  the virtualized row array, a marker field parallel to the group marker, and a
  splice inside the loop that builds the row/meta pair the focus model indexes by.
  A render-path `TypeError` that emptied the whole table took three composing
  defects to produce, none of them in the drill's own logic and all three in
  machinery that existed only to splice rows into a grid not built to have rows
  spliced into it.

  `TableGroupTreeRowMeta` loses `isDrillable`; `hasChildren` alone decides
  `aria-expanded`, and a leaf group is simply not a tree node to open.

  Migrating: replace `isGroupDrillEnabled: true` plus a `fetchDrill` prop with
  `groupDetailsPath: '<your route>'` on the loader `meta`, and serve that route.
  Removing them is a compile error rather than a silently inert affordance.

  See ADR-087, which supersedes ADR-079.

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
  - @lcabrera/api@0.4.1

## 0.4.0

### Minor Changes

- 4911e39: Each aggregate selected on a grouped Table now renders as **its own column**,
  under a two-level header naming the source column above the function.

  Previously every aggregate applied to a column landed in that column's single
  cell, so two measures on `Total Amount` rendered as one cell reading
  `Average … Minimum …` — truncated together, under a header that named neither,
  and sortable, resizable and pinnable neither separately nor at all. A measure is
  a column's worth of data; giving it a column puts it inside the machinery every
  other column already has.

  The columns are **derived, not declared**: they appear when a grouping is
  applied and vanish when it clears, and nothing about them reaches the persisted
  column layout — so a deselected aggregate needs no cleanup, and ungrouping
  restores your own columns exactly. A **primary-key** column is measured beside
  itself rather than replaced, because a table with no column carrying
  `isPrimaryKey` cannot resolve a row id for its CRUD links.

  Sorting a measure column now reaches the query. `toGroupSort` turns a sort
  naming a measure into an aggregate `ORDER BY` term and places it after the key
  terms, which is the one position that both orders something and is accepted —
  an aggregate ahead of a key is refused rather than quietly demoted.

  **Breaking, for a consumer calling the column derivations directly.**
  `deriveColumnViewState` and `getPinnedDerivedColumnsState` now require an
  `aggregates` argument. It is required rather than defaulted on purpose: these
  functions are re-run on every column change, and a caller free to omit it would
  silently paint the source column instead of its measures on the next pin, hide
  or resize. Pass the applied `aggregates` from the grouping state — `[]` where
  nothing is grouped.

  Two additive changes to the published type surface:

  - `DataKey` admits `AggregateColumnKey` (`` `${string}:${TableAggregateFn}` ``),
    by the same precedent that admits `'actions'` — a column identity that names
    no field of the row.
  - `TableColumn` gains an optional `headerGroupLabel`, the name stated above a
    derived column in the header band.
  - `pruneSortingToColumns` is exported: it drops a sort naming a column
    **nothing can order by**, which is what stops a measure sort outliving its
    column. It takes the declared column keys and the painted ones as two
    separate arguments, because a measured column is replaced while grouped —
    pruning against the painted list alone would discard a sort on a column that
    is merely not on screen.

  A measure **inherits its source column's layout locks**. `isStatic` and
  `isResizable` carry onto the derived columns, so a column you froze cannot be
  pinned, hidden or resized through the measures that replace it — every layout
  action on a measure acts on the column it measures, which would otherwise have
  made a measure a way around the lock. The flags describing the _data_ do not
  carry: a measure is never filterable or groupable and always sortable,
  whatever its source allows.

  **One known limitation.** A measured column is replaced, and every row renders
  over the same columns — so a **drilled detail row** has no cell for its own raw
  value while an aggregate is applied to that column. Keeping the source column
  alongside its measures would fix it at the cost of an empty column on every
  group row of every grouped view, to serve rows only a drill produces. The
  inline drill is being replaced by a modal route that applies no grouping, where
  every declared column is present and the question does not arise.

- e8a19de: Grouped reads can now be a **cube**, alongside `flat` and `rollup`.

  `GroupingMode` gains `'cube'`, which emits every subset of the group keys as an
  explicit grouping set — the same construct the other two modes already compile
  to (ADR-059), so nothing about decoding a grouped row changes. The mask still
  tells a structural NULL from a real one, and `groupingSetMasks` still ships in
  emission order.

  ```ts
  await selectGroupedRows({
    aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
    allowedColumns: ['region', 'channel', 'amount'],
    grouping: 'cube',
    keys: ['region', 'channel'],
    maxRows: 5000,
    schema: 'public',
    table: 'orders',
  });
  // grouping sets: (region, channel), (region), (channel), ()
  ```

  **A cube result is a lattice, not a tree.** `(channel)` with no region is a
  child of no region row and has no depth, so a consumer that indents grouped rows
  by path length is correct for `flat` and `rollup` and wrong here — render a cube
  flat, with each row carrying its own coordinates. The rows stay long, one per
  grouping-set combination, so a pivot projection remains possible later.

  **A cube is capped at three group keys**, one below the four the other modes
  allow, and is refused at construction with the existing `'too-many-keys'`
  reason. Its set count is `2ⁿ` rather than `n+1`, and the cardinality estimate
  cannot be relied on to catch that: the estimate is `unknown` whenever a key has
  no statistics, and unknown warns rather than refuses, so on an unanalysed table
  there would be no bound at all.

  **The depth-refusal message now names the mode**, for every mode rather than
  only for cube. For the same over-deep `flat` request that previously read:

  > A grouped query takes at most 4 group keys; got 5.

  it now reads:

  > A flat grouping takes at most 4 group keys; got 5.

  The cap for `flat` and `rollup` is unchanged at four — only the wording moved.
  Cube then states its own lower cap in the same shape: `A cube grouping takes at
most 3 group keys; got 4.`

  Anything matching on that message text needs updating. The `reason`
  discriminant is unchanged and is what callers should branch on.

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

- 7addbad: A grouped read can be issued and decoded without the caller re-deriving how.

  `@lcabrera/server/db/olap` shipped `toGroupRow`, which decodes one row. What it
  did not ship was the step either side of it: building the aggregate list a
  grouped read is issued with, pairing each requested aggregate with the alias the
  builder projected it under, and deriving the grouped `ORDER BY`. Every consumer
  had to write those again, against a result that already carries everything they
  need.

  **`toGroupAggregates` and `decodeGroupedRows` are two halves of one convention.**
  A grouped read always asks for `count(*)`, because a group row states how many
  rows it covers whether or not the route selected an aggregate — and the position
  `count` occupies is the position the decode skips. Nothing in the type system
  relates the two, so they ship in one module for the reason ADR-082 keeps an
  encoder beside its parser: split apart they can disagree in any way at all and
  still compile, and the symptom is every aggregate rendering against its
  neighbour's column, with no error anywhere.

  **`toGroupSort`** derives the grouped `ORDER BY` from the table's own sort — one
  term per key in nesting order, carrying the user's direction where they sorted
  that key and ascending where they did not. The nesting order is the tree, so a
  sort sets a level's direction rather than reordering the levels. A sort on any
  other column is dropped, because a grouped result has one row per group and no
  row of that column's values.

  A route now supplies its table, the aggregates its UI offered, and its row
  ceiling. Nothing else.

- f85324d: Adds a column filter that selects the rows where a column **holds no value**.

  Until now every member of `ColumnFilter` carried a value and mapped to a
  comparison, and SQL equality against NULL is never true — so there was no
  filter a user could build, or a URL could carry, that selected null rows. The
  gap was load-bearing: `resolveDrillHandoffSearch` refuses to offer its link at
  all when a group's key is NULL, because "the filter vocabulary has no 'is null'
  member", and the NULL group is the one a reader is most likely to click into.

  **The query layer already emitted `IS NULL`.** `QueryFilter` has a unary arm and
  `appendFilterClause` gives it a branch that binds no parameter. What was missing
  was a vocabulary that could reach it, so this adds the span between: an
  `EmptyFilter` in both packages' `ColumnFilter` unions, a `toQueryFilters` arm
  producing the unary filter, a URL codec, and the operators in the filter editor.

  **It is its own `type`, not an operator on the value-carrying filters.**
  Emptiness is not a comparison: adding `isEmpty` to `TextFilter` and its siblings
  would put a `value` on every one of them that must then be ignored, and force
  each editor to hide its own input. One value-less member keeps "carries a value"
  true of every other member of the union.

  **Empty means SQL NULL and deliberately not the empty string.** A text column
  can hold both and they are different facts — `''` is a value someone stored.
  A column where `''` is meaningful wants a text `equals ''`.

  The operators are offered for **every** column type, because any column can hold
  nothing; the data type decides which comparisons make sense, not whether
  emptiness does.

  **In the URL it is an object, `{"op":"ie"}`, not an array.** Every other
  compact filter is an array, and a select filter is written as its bare values —
  so `["ie"]` already means "this column equals the value `ie`". Claiming that
  form would have made `ie` and `nie` reserved words in a position holding
  arbitrary user data, turning a consumer's "country is ie" link into "country is
  empty" with nothing to say so.

  A boolean column gets these operators from `BooleanFilterInput` rather than the
  operator dropdown, which `FilterInputs` does not render for one.

  For consumers: `ColumnFilter` gains a variant, so an exhaustive `switch` over
  `filter.type` that previously compiled may now need an arm. Three such
  dispatches inside these packages did — the URL serializer, the drawer's
  validity check, and the URL-restore compatibility check — and each would have
  dropped the filter silently rather than failing.

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

- d8113ad: `QueryFilter` gains an `isNull` operator.

  `UnaryOperator` was `'isNotNull'` alone, which left "this column is null"
  inexpressible — and it cannot be spelled as an equality, because SQL's
  three-valued logic makes `col = NULL` never match, not even a null row. The
  vocabulary is now closed under negation:

  ```ts
  filters: [{ column: 'shipping_country', operator: 'isNull' }];
  // → WHERE "shipping_country" IS NULL
  ```

  Like `isNotNull` it carries no value and consumes no parameter slot, so filters
  after it keep their placeholders.

  **Widening the union is breaking for a consumer that exhaustively switches on
  `UnaryOperator`** with no default arm. That is the intended shape: the operator
  maps in this package are closed records, which is what makes a new operator a
  type error rather than a silent gap.

### Patch Changes

- Updated dependencies [ae3022a]
- Updated dependencies [dd82183]
  - @lcabrera/api@0.4.0

## 0.3.0

### Minor Changes

- 8787dcd: `@lcabrera/server` gains `getColumnGroupingCapabilities`
  (`@lcabrera/server/db/get-column-grouping-capabilities.util`) — the answer to
  "may this column be grouped, and what may it be aggregated with?", resolved from
  the Postgres catalogue in one round trip rather than from a hand-maintained type
  map.

  It applies two gates, and a column must clear both. The **analytical role**,
  derived from `pg_type.typcategory`, decides what is worth offering: dimensions
  (string, boolean, date, enum) are group keys, facts (the numeric family) are
  aggregated and may be keys when their statistics show low cardinality, and
  everything else — `jsonb`, geometric types, arrays, `bytea` — is out of both. The
  **catalogue** then decides what Postgres can actually do, so an extension or
  domain type the role table has no opinion about still cannot reach an operator it
  lacks, and a `boolean` column is not offered the `min`/`max` Postgres does not
  define for it.

  The role gate exists because the catalogue alone gets `jsonb` wrong: it has an
  equality operator, so `GROUP BY` on it parses and runs, and a catalogue-only rule
  would offer a column whose grouping is analytically meaningless.

  A refused column carries one of five distinguishable reasons rather than a bare
  `false`, so a UI can say why — `not-a-dimension`, `no-equality-operator`,
  `unique-ish`, `stats-unavailable`, `too-many-distinct`. Grouping by a primary key
  is the likeliest mistake, and it reports as `unique-ish`.

  Schema, table and the column list are all bound parameters, so the query has no
  identifier-interpolation surface. `@lcabrera/server/db/group-query-builder/group-query-builder.types`
  is exported alongside it for `ColumnGroupingCapability`, `AggregateFn` and the
  refusal-reason union.

  Additive only — no existing export changes.

- d33b98d: `@lcabrera/server` gains `resolveFilterOptionsSource`
  (`@lcabrera/server/filters/resolve-filter-options-source.util`) — the
  authorization step in front of `selectFilterOptions`, plus the
  `FilterOptionsSources` registry shape it reads.

  `selectFilterOptions` allow-lists the column it is handed, but `schema` and
  `table` reach it as data and it has no basis to judge either. A consumer serving
  a generic distinct-values endpoint receives all three identifiers on a request,
  so it must decide **which sources may be asked at all** before any SQL is
  composed — and that question has had no package-side answer, which is why two
  consumers in this repository had each hand-rolled the same lookup.

  The registry stays the caller's: `schema.table` → the columns that source
  exposes → each column's `ColumnType`. What the package now owns is the rule.
  Given a request it returns the source's `allowedColumns` and the column's type,
  ready to hand to `selectFilterOptions`, or a refusal that separates an unknown
  source from an unknown column — a value rather than a throw, because the edges
  consuming it answer differently and neither wants to catch. Keep the refusal out
  of the response body: naming which half failed tells a caller which tables
  exist.

  Both lookups read own properties only, so a request for the column
  `constructor` is refused rather than resolving to `Object`'s and producing a
  `columnType` that is a function.

  Additive only — no existing export changes.

- f6607ec: Add `buildGroupQuery` — grouped reads over `GROUP BY GROUPING SETS`.

  New subpath `./db/group-query-builder/build-group-query.util`. It turns a
  `GroupQueryDescriptor` into a parameterized grouped query: the group keys, one
  variadic `GROUPING(k₁, …, kₙ)` mask, the requested aggregates (with optional
  `FILTER (WHERE …)`), `GROUP BY GROUPING SETS`, a subtotal-aware `ORDER BY` and a
  `LIMIT` backstop. `flat` and `rollup` are supported; rollup is expanded into
  explicit sets in TypeScript rather than emitted as `ROLLUP(…)` sugar (ADR-059).

  The result carries `keys`, `maskAlias` and `groupingSetMasks` beside the SQL,
  because a grouped row cannot be read without them: under a rollup, a NULL
  `shipping_country` is either a real NULL or the subtotal across every country,
  and only `GROUPING()` tells them apart.

  Legality is passed in, not re-derived. The descriptor takes the
  `ColumnGroupingCapability` map that `getColumnGroupingCapabilities` resolves
  from the catalogue, and the builder refuses a group key the catalogue turned
  down or an aggregate it does not offer — so `min(jsonb)` is a message naming the
  column and its type rather than a driver error at execution. `allowedColumns` is
  **required** here, unlike `SelectQueryDescriptor` where it is opt-in: every group
  key is request-derived by construction.

  Two construction-time refusals worth knowing about, both for failures Postgres
  reports quietly. An alias longer than 63 characters is refused rather than
  truncated, because Postgres truncates with only a `NOTICE` and `pg` then folds
  two truncation-equal aliases into one row key holding the second value — losing
  the first column with no error anywhere; pass a shorter explicit `alias`. And a
  projected alias may not collide with a real column of the table, which is what
  would otherwise happen to `group_mask` or `count_rows`.

  `GroupingMode` is `'flat' | 'rollup'` today. Grouping guard rails, the per-query
  timeout and cube expansion are not part of this.

  **Breaking for one published type.** `ColumnGroupingCapability` (from the
  `./db/group-query-builder/group-query-builder.types` subpath) is now
  discriminated on `canGroup`, so a refusal must carry its reason:

  ```ts
  | { canGroup: false; refusal: GroupKeyRefusalReason; … }
  | { canGroup: true;  refusal?: never; … }
  ```

  Reading is unaffected — `capability.refusal` still resolves without narrowing
  first, and `getColumnGroupingCapabilities` returns the same values it always
  did. What no longer compiles is _constructing_ one — a test double, or a
  hand-built capability map — with `canGroup: false` and no `refusal`, or with a
  `canGroup` computed as a `boolean` expression rather than a literal.

  That pairing was already the documented contract; it just was not enforced, and
  the gap was reachable: a capability map built by hand could make the builder
  report `not a legal group key: undefined`. Widening the type back would restore
  a state that has no meaning — a column refused for no reason — so the flag and
  its reason move together instead.

- f16ffa7: `selectGroupedRows` now bounds the read it runs, and a grouped read that is
  refused or cut short has a type.

  **Guard rails.** Before the query runs, the group keys' distinct estimates are
  combined over the grouping sets that will actually be emitted. Above 50 000
  estimated rows the read is refused — naming the widest group key, which is the
  one whose removal helps most; above 5 000 it runs and reports a warning beside
  the rows. When the table has never been analysed there is no estimate to work
  from, and the read **proceeds** rather than being refused: statistics are absent
  on every freshly restored database, and refusing there would make grouping look
  broken exactly where it is most needed. It runs under a row limit instead, and
  reaching that limit is itself a refusal — a grouped result missing its tail is
  missing the subtotals that belong to it, so it reads exactly like a correct one.

  **A per-query statement timeout.** A grouped read now runs in a transaction
  carrying its own `statement_timeout`, from a new optional
  `DB_GROUP_STATEMENT_TIMEOUT_MS` (10 s, deliberately well below the pool-wide
  `DB_STATEMENT_TIMEOUT_MS`). It is set transaction-locally through `set_config`,
  so it is gone at `COMMIT` and cannot re-tune later queries that borrow the same
  pooled connection.

  **New exports.**

  - `@lcabrera/server/errors/query-canceled.error` — `QueryCanceledError`, SQLSTATE
    `57014`, extending `PersistenceError`. Named for the code rather than for the
    timeout, since `pg_cancel_backend` raises it too.
  - `@lcabrera/server/errors/grouping-refused.error` — `GroupingRefusedError`,
    carrying `reason`, the offending `column` and the estimated rows.
  - `@lcabrera/server/errors/to-serializable-db-error.util` —
    `toSerializableDbError`, which maps either into `SerializableDbError`, a plain
    discriminated union with no prototype. Use it at any loader or action edge:
    React Router single fetch drops functions, so an error class arrives at the
    client unrecognisable and, `Error.message` being non-enumerable, without its
    message.
  - `SerializableDbError` and `GroupingRefusalReason` on
    `@lcabrera/server/errors/errors.types`; `GroupCardinalityEstimate`,
    `GroupCardinalityWarning`, `GroupGuardRails` and `GroupRowLimit` on
    `@lcabrera/server/db/group-query-builder/group-query-builder.types`;
    `MAX_GROUP_ROWS_WARN`/`MAX_GROUP_ROWS_REFUSE` on the grouping constants.

  **Behavioural changes to know about.**

  - `selectGroupedRows` returns `estimate` and, when there is one, `warning`
    alongside the existing decode metadata.
  - `buildGroupQuery` returns `guardRails`, and the `LIMIT` it emits is the rails'
    answer rather than the requested `maxRows`. Read
    `guardRails.rowLimit.limit` if you need the number that ran.
  - The grouped-read assertions now throw `GroupingRefusedError` instead of a bare
    `Error` — including an allow-list or malformed-identifier refusal, which used
    to escape as a plain `Error`. Messages are unchanged, and it still extends
    `Error` — but it is **not** a `PersistenceError`, because nothing in it came
    from the driver. A consumer using `instanceof PersistenceError` as "everything
    this package throws" needs the second arm, or `toSerializableDbError`, which
    covers both.
  - `runInTransaction` translates its own `BEGIN` and `COMMIT` failures through
    `mapDbError`; they were the last statements in the package reaching the driver
    untranslated. A caller that was matching on pg's text for those two will stop
    matching — the original stays on `Error.cause`. What the callback throws is
    rethrown untouched, as before.
  - Passing your own `tx` to `selectGroupedRows` applies the grouped-read ceiling
    to the rest of **that** transaction, not only to this call — a consequence of
    the timeout being transaction-local. Call it without `tx` to get a transaction
    scoped to the read alone.

- b03eb65: Admit `inet`/`cidr` and `interval` columns to the grouping role table.

  `getColumnGroupingCapabilities` previously refused all three with
  `not-a-dimension`, because their Postgres type categories were not in the
  analytical-role mapping. An `inet` or `cidr` column now resolves as a dimension
  and may be a group key; an `interval` resolves as a fact and is offered `sum` and
  `avg`, which Postgres defines for it and for no other non-numeric type.

  `uuid` is unchanged and still refused — it shares its type category with `jsonb`
  and is indistinguishable from one in the catalogue, so admitting it is a separate
  decision rather than an extension of this one.

- fa5a878: Admit `uuid` columns as grouping dimensions.

  `getColumnGroupingCapabilities` previously refused every `uuid` column with
  `not-a-dimension`, because Postgres files `uuid` under the same type category as
  `jsonb` and the analytical-role gate resolves from that category. A foreign-key
  `uuid` — `tenant_id`, `region_id` — is now a legal group key, offered `count`
  and `countDistinct`.

  `uuid` is admitted by name rather than by category, so `jsonb`, `xml` and
  `bytea` remain refused. It also has to demonstrate low cardinality: unlike an
  ordinary dimension, a `uuid` column with no statistics is refused
  `stats-unavailable` rather than grouped optimistically, and a primary-key `uuid`
  is still refused `unique-ish`.

  **Breaking for one published type.** `ColumnCapabilityRow` (from the
  `./db/group-query-builder/group-query-builder.types` subpath) gains a required
  `typeNamespace` field, so code that _constructs_ one — a test double, or a
  hand-written query typed to that shape — no longer compiles until it supplies
  the field. Reading a row is unaffected, and no exported function takes one as a
  parameter.

  The field is required rather than optional on purpose: the name alone does not
  identify a type. Type names are per-schema, so a `CREATE TYPE app.uuid AS (…)`
  composite reports `typname = 'uuid'` exactly like the built-in, and matching
  without the namespace would admit an unrenderable type as a group key. An
  optional field would let a caller silently skip the only value that tells the
  two apart.

- acea1bd: Row grouping supports several keys at once, and which aggregates a column may
  take is now decided by that column's real Postgres type rather than by its
  declared `dataType`.

  **What is new**

  - **Multi-key grouping** up to `MAX_TABLE_GROUP_KEYS`, refused beyond it. The
    key order is the grouped query's nesting order, so it is preserved
    end to end and a reorder is a real edit.
  - **Aggregate selection**, one aggregate per column, offered from the
    catalogue's per-column answer. A menu shaped from `TableColumn.dataType`
    offers `sum` on a `numeric` it reports as `string` and hides it on the one
    column that can take it; this reads the real type instead (ADR-058).
  - **A Grouping tab** in the table settings drawer, present only where the route
    declared `isGroupingEnabled`.
  - `createTableRouteLoader` takes an optional `resolveGroupingCapabilities`, and
    ships its answer on `metaState.groupingCapabilities` — spread last and
    unconditionally, so a client-controlled cookie cannot seed it (ADR-063).
  - `@lcabrera/server` exports `db/group-query-builder/group-query-builder.constants`.

  **What this deliberately does not do**

  - **Filtered aggregates are deferred.** The compact `grouping` search param
    carries a column-to-function map with no slot for a per-aggregate filter or
    alias, so a filtered aggregate cannot round-trip through the transport the
    whole grouping configuration travels in. Every path `@lcabrera/ui` owns is
    closed to one — no menu entry, no command, and no state the grouping store can
    hold describes it. `GroupAggregate.filters` still exists on
    `@lcabrera/server`, so a consumer calling `selectGroupedRows` directly can
    still build a filtered aggregate: what is closed is reaching one through the
    table, not the capability itself. Lifting the deferral means extending the
    param first.
  - **A group key or aggregate the database catalogue refuses still raises.** Both
    menus are built from the resolved capabilities, so the table cannot offer one;
    a request assembled by hand reaches `assertGroupKeys` /
    `assertGroupAggregates` and throws. Rendering that refusal instead is tracked
    separately, and `groupingCapabilities` carries `canGroup` and the refusal
    reason for it.

  **Breaking, for a consumer of `@lcabrera/ui`**

  - `TableGroupRowSummary` replaces `columnKey`/`label` with `path`, an ordered
    list of `{ columnKey, label }`, and adds `aggregates`. A single-key grouping
    is the one-element case. A route that builds group rows itself has to build
    the new shape; `getTableGroupRowSummary` refuses the old one rather than
    rendering half a group heading.
  - `TableGroupingState` gains a required `aggregates` map.
  - `createTableRouteLoader`'s loader is now `async`, and the `grouping` it hands
    `fetchPage` is a `TableGroupingState` rather than a `readonly string[]`.
    `TableRouteLoaderData` is unchanged for consumers — it awaits the return — but
    a route that called the loader directly must await it.

- b882b3a: **Breaking:** a grouped grid renders a hierarchy column instead of a spanning
  banner, rollup emits subtotals and a grand total, and an aggregate sort that
  would rank an ancestor is refused rather than silently demoted (ADR-065).

  ## What a grouped table looks like now

  A group row is a full row of cells, not a banner. The grid injects its own
  **hierarchy column** — left-pinned, first, labelled with the group keys in
  nesting order, and absent from the column-order drawer — and the group's label
  sits there indented by depth. Every other column renders that group's selected
  aggregate under its own header, or an em dash at reduced opacity where no
  aggregate was selected. A data column that is currently a group key renders
  blank on its detail rows, because the group row above already states it.

  Three things follow that were not previously possible: a group row's cells are
  ordinary `role="gridcell"` cells, so the roving tab stop reaches them; a
  subtotal has somewhere to put its measures; and every row of a grouped body
  exposes the same cell count.

  ## Rollup

  `TableGroupingState` gains a `mode` — `flat` (today's single grouping set) or
  `rollup` (one set per prefix of the key list, plus the grand total). It travels
  in the `grouping` search param, is chosen in the settings drawer's Grouping tab,
  and reaches the query descriptor. **`flat` is the default and is omitted from
  the param**, so a link written before this release still reads and a table left
  on the default emits the string it always did.

  Under a rollup, a real data NULL and a structural subtotal are textually
  identical and only `GROUPING()` separates them. The grid tells them apart by
  depth and label: a real NULL renders at its own child depth with the key's own
  label, while the subtotal renders one level shallower, in bold, as
  `<level> total`. The grand total is the row with no key at all.

  An aggregated cell whose column carries an active filter now renders an
  indicator. A `WHERE` filter runs before aggregation, so a total over a filtered
  column covers only the rows that survived it — correct SQL, and a number that
  lies by omission unless the cell says so.

  ## `@lcabrera/server`: the ordering, and one refusal

  `buildGroupOrderByClause` splices an aggregate sort into the **innermost** level
  — after `GROUPING(kₙ)`, ahead of `kₙ`'s own value term, which stays last as the
  tiebreak. Appending it after every key term, which is what this replaces, emits
  a term that can never fire: within a grouping set the key columns already
  identify the row, so the sort was accepted, emitted and dead.

  An aggregate entry listed **ahead of** a key entry now throws at construction
  rather than being reordered behind it. Ranking parents by their own totals needs
  the parent's aggregate on the child row (`sum(…) OVER (PARTITION BY k₁)`) and is
  not expressible here; a refusal is the only answer that cannot be mistaken for
  having worked.

  A single flat grouping set still emits ordering identical to
  `buildOrderByClause`'s, and no `NULLS` keyword is emitted in any mode.

  ## Migration

  **`TableGroupingState` gains a required `mode`.** Every construction site is a
  compile error naming the field. A consumer that has never wanted rollup adds
  `mode: 'flat'`, which reproduces the previous behaviour exactly.

  **`TableGroupRowSummary` gains a required `isSubtotal`,** and `path` now holds
  only the keys a row's grouping set actually grouped by. A route building
  summaries by hand sets `isSubtotal: false` and keeps its full path to reproduce
  the previous behaviour; a route decoding a rollup drops the rolled-up keys from
  `path` and sets the flag from the mask. `getTableGroupRowSummary` refuses a
  summary without the flag, and — deliberately — now **accepts an empty `path`**,
  which it previously refused: that is the grand total, the one row a rollup exists
  to produce.

  **`TableGroupHeaderRow` is deleted.** It rendered the banner and has no
  surviving configuration; a group row is now rendered by `TableBodyRows` through
  the same cell pipeline every other row takes. It was a private delegate and was
  not exported from the package root.

  **`deriveColumnViewState` and `getPinnedDerivedColumnsState` take a required
  `groupingKeys`.** Both are exported from `@lcabrera/ui`; a caller that does not
  group passes `[]`. It is required rather than defaulted so that a re-derivation
  which forgets it is a compile error instead of a hierarchy column that silently
  disappears on the next pin or hide.

  **A grouped route's loader meta gains `groupingMode`,** written by
  `createTableRouteLoader`. A hand-written loader that omits it gets `flat`.

- 4912086: `@lcabrera/server` gains `selectGroupedRows`
  (`@lcabrera/server/db/select-grouped-rows.util`) — the analytical sibling of
  `selectRows`, and the one place the grouped-read halves meet a connection.

  It resolves what each group key and aggregate column may do
  (`getColumnGroupingCapabilities`, one catalogue round trip), builds the
  `GROUP BY GROUPING SETS` query from that answer (`buildGroupQuery`), and runs it.

  Composing it this way is what keeps ADR-058's gates enforceable. `buildGroupQuery`
  is pure and takes the capability map as data, so a caller wiring the two halves
  together itself is one hand-written map away from authorizing a group key the
  catalogue refused. There is now a single entry point that cannot be handed one.

  The result carries `aggregates`, `keys`, `groupingSetMasks` and `maskAlias`
  beside the rows, because a grouped row cannot be decoded without them: an
  aggregate's alias is derived from its function and column, and the `GROUPING()`
  mask's bit positions are relative to the key order.

  `tx` threads through **both** round trips, so a caller that needs the capability
  answer and the query it authorizes to see one snapshot passes a transaction and
  gets it. Omitted, each runs on the pool — correct for a read, and no connection is
  held for a caller that will not reuse it.

  Additive only — no existing export changes.

- ed65f36: `@lcabrera/server` gains `resolveQuerySort`
  (`@lcabrera/server/sort/resolve-query-sort.util`) and the `ColumnSort` shape it
  accepts (`@lcabrera/server/sort/sort.types`) — the sort half of the boundary
  `filters/` already owns for column filters.

  Every endpoint built on `selectRows` has to bridge the same gap: a paginated
  request carries `{ columnKey, direction }` rules, and the query builders take
  `{ column, direction }`. Renaming that is two lines, which is exactly why each
  new endpoint rewrote it, and why the interesting half kept being left out.

  The interesting half is the **non-empty guarantee**. A paginated read with no
  ORDER BY leaves row order unspecified, so pages repeat and skip rows whenever
  the planner changes its mind between requests — it presents as data corruption
  and reproduces only under load. `resolveQuerySort` substitutes the endpoint's
  fallback when the request sorted by nothing, and throws when that fallback is
  itself empty, at the one place that can see both inputs. A hand-rolled `.map()`
  returns `[]` and reaches the database.

  `ColumnSort` is restated rather than imported from `@lcabrera/api`, whose
  `PaginatedSort` is structurally the same: both it and `@lcabrera/ui` are
  browser-safe, this package's graph includes the Postgres driver, and an import
  across that line is the edge ADR-038 splits the packages to prevent and ADR-039
  refuses to reintroduce. Structural typing means a sort built by either package
  is assignable with no adapter. The one deliberate difference is that `direction`
  is required here — an ORDER BY entry has nothing to emit without it, so the
  default belongs where the request is parsed.

  Distinct from `@lcabrera/ui`'s `toQuerySort`, which sanitizes a typed
  `SortingState` on the client and may legitimately yield an empty sort; this is
  the server-side edge that must not.

  Additive only — no existing export changes.

## 0.2.0

### Minor Changes

- c010a6e: Make `SELECT DISTINCT` a generic capability instead of a dropdown-specific one.

  - `SelectQueryDescriptor` gains `distinct?: boolean`, so `buildSelectQuery` / `selectRows` emit `SELECT DISTINCT` over a list of columns with the usual filters/sort/pagination. `buildDistinctQuery` and the new `selectDistinctRows` are thin wrappers over them (kept for readability), no longer locked to a single aliased column.
  - New `isNotNull` comparison operator (`QueryFilter` is now a discriminated union — unary operators carry no value).
  - New `selectFilterOptions` helper: the filter-dropdown specialization built _on top of_ `selectDistinctRows` — one column's distinct, non-empty (empty dropped only for `text` via `ColumnType`), ordered values as a `{ values, hasMore }` page.

  Removes the previous single-purpose `selectDistinctValues` / `buildDistinctValuePredicate` (`buildDistinctQuery` no longer aliases to `value`, bakes in a predicate, or restricts to one column).

- a649b31: Add the `getRowsCount` executor — the count sibling of `getMaxValue`. It runs
  `buildCountQuery` on the pool singleton and returns the matching row count,
  requiring an explicit `column` (typically the primary key) so a total is never
  an ambiguous `count(*)`. Pass it the same `filters`/`allowedColumns` as the data
  query and a page can never drift from its total.
- fbf9d05: Add opt-in keyset ("seek") pagination to the SELECT builder. Pass
  `SelectQueryDescriptor.cursor` — the sort-key tuple of the last row of the
  previous page, plus the column that makes the sort a total order — and
  `buildSelectQuery` resumes strictly after that row in O(limit) instead of walking
  and discarding `offset` rows. Omit it and nothing changes: `OFFSET` remains the
  default, and an offset query's SQL is byte-identical to before.

  The emitted predicate is a NULL-aware lexicographic comparison rather than the
  compact `(a, b) > ($1, $2)` row form, which cannot express mixed sort directions
  and silently stops a scroll at the first NULL in a sortable nullable column. A
  cursor the builder cannot resume correctly — no sort, a tuple that does not match
  it, or one not ending on a non-null unique column — throws at construction time,
  the same posture as refusing an unfiltered UPDATE. See ADR-052.

- 536341c: Harden the persistence layer: typed DB errors, a transaction seam, and a tuned pool.

  **Typed errors (new `./errors/*` subpaths).** `mapDbError` translates a driver
  rejection into `UniqueConstraintViolationError` (`23505`),
  `ForeignKeyViolationError` (`23503`) or `PersistenceError`, all sharing one base
  class so a single `instanceof PersistenceError` catches every translated failure.
  Every executor now applies it, so a `pg` message — which names tables, columns and
  indexes, and whose `detail` line quotes the offending values — no longer escapes
  the package. The original rejection stays on `Error.cause` for server-side logging,
  and `fields.constraint` / `fields.column` / `fields.code` are carried so a consumer
  can route a violation to the right form field. `hasPostgresErrorCode` is exported
  for a SQLSTATE this package does not name.

  **Note for anyone matching on error text:** a rejection from an executor now
  carries our message, not the driver's. Branch on the error type or
  `fields.constraint` instead.

  **Transactions.** `withTransaction({ run })` borrows one pooled connection and
  runs a callback inside BEGIN/COMMIT/ROLLBACK, always releasing it;
  `runInTransaction({ client, run })` does the same over a connection the caller
  owns. A failed ROLLBACK no longer masks the error being unwound. Every executor
  accepts an optional `tx` (`ExecutorOptions` in the new `./db/db.types` subpath) and
  falls back to the pool singleton when it is omitted, so existing callers are
  unchanged.

  **Pool tuning.** `DB_POOL_MAX`, `DB_CONNECTION_TIMEOUT_MS`, `DB_IDLE_TIMEOUT_MS`
  and `DB_STATEMENT_TIMEOUT_MS` join the shared env schema — optional, coerced, with
  defaults that bound the two cases pg leaves unbounded (connection acquisition and
  statement duration). An environment that predates them boots unchanged.

  See ADR-050 and ADR-051.

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
