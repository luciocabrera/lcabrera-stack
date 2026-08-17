# @lcabrera/server

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
