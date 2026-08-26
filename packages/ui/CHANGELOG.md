# @lcabrera/ui

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

- dd82183: A grouped table can now drill a leaf group into its own rows.

  A group row states how many rows it holds; until now there was no way to see
  them without ungrouping the whole table and rebuilding the filters by hand.
  Clicking the chevron on a **leaf** group — one whose path names every applied
  group key — fetches one bounded page of its rows and splices them underneath it
  (ADR-079).

  **Wiring it takes two things, and both are deliberate.** The route declares
  `isGroupDrillEnabled` on its loader `meta` (ADR-063), and supplies `fetchDrill`
  to `TableRouteView`. The flag says the endpoint exists; the fetcher is the call
  that reaches it, and it is a prop because a function does not survive the loader
  boundary. `useTableRoutePage` composes the query, so a drill inherits the
  grouped view's filters and sort by construction — a drilled page read under
  different filters returns rows that are individually true and wrong under the
  heading above them.

  **One page, then a hand-off.** Where a group holds more rows than the page
  fetched, the last row states the shortfall and links to the same table
  ungrouped, filtered to that group. There is deliberately no second page: the
  hand-off exists so nobody has to build in-place paging inside a group.

  **A drill can fail, and says so.** A rejection renders a row that names no cause
  and names the gesture that retries — closing and reopening the group. Nothing
  retries on the user's behalf, which is what keeps a bounded read bounded.

  **Accessibility.** A drillable leaf now carries `aria-expanded`, reading `false`
  until the group has been opened — it flips when the drill is asked for, not when
  the rows land, because the loading and failure rows are themselves content under
  it — and responds to `ArrowRight`/`ArrowLeft` like any other tree node. The hand-off is a real link but is **not** a tab stop — the
  grid has exactly one (ADR-062) — and is reached with `Enter` on the focused
  cell, which now follows any linked cell's link.

  The hand-off is withheld where a group key cannot be expressed as a filter, such
  as a NULL key: a partial filter selects a larger set than the group, so the link
  would open a table showing the wrong rows under the right heading.

  `TableGroupDrillFetcher` and `TableGroupDrillRequest` are exported for typing a
  route's fetcher. A table that declares no drill behaves exactly as before.

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

- 5f43ece: A grouped grid folds a group from the row that starts it, not the subtotal that
  ends it.

  The chevron sat on whichever row owned loaded children, which under a rollup is
  the **subtotal** — and a subtotal is emitted after the rows it totals. So a
  group's label appeared at the top of its block and the control for it at the
  bottom: to collapse a group you had to scroll to its end first, and on a group
  longer than the viewport the control for the block you were looking at was
  off-screen entirely.

  The control now renders in the cell where its level's key is **drawn**. A row
  states its ancestors and does not own them, so those are the levels it folds,
  each in that key's own column; a carried cell renders no control, exactly as it
  renders no label. `ArrowLeft`/`ArrowRight` act on the level the focused column
  holds, so the keyboard folds what the chevron in the same cell folds.

  Two rules keep it coherent, and both are stated in the ADR-080 amendment:

  - **A row skips its own group only when it is a subtotal, and only while that
    group is open.** Every other group row precedes what it owns, so folding
    itself already puts the control at the top. Once a group folds, its subtotal
    is the only row left, so the control returns there and the group can be
    reopened.
  - **A leaf that has already drilled answers with its drill**, not a fold, because
    the drill reports a group as open from the moment the fetch starts rather than
    when its rows arrive.

  No tab stops and no ARIA are added. The chevron is still `aria-hidden` and still
  not a button, and `aria-expanded` stays on the row describing that row's own
  group — a row does not report its ancestors' states.

  The published surface is unchanged — `reports/api-surface/ui.txt` is
  byte-identical, because the types this moves through (`TableGroupDisclosureState`
  and the new `TableGroupLevelDisclosure`) are internal to the Table and are not
  exported from the package. What a consumer sees is the behaviour: where the
  chevron is, and which group it folds.

- f608a76: A grouped Table can open or fold **every** group in one action, and a fold that
  could not be undone is no longer offered at all.

  The column header's grouping section gains **Expand All Groups** and **Collapse
  All Groups**, beside "Clear Grouping" and gated the same way — always shown so
  the menu keeps its shape, disabled when there is nothing to do. They are ordinary
  menu items, so they are reachable by keyboard, and they take effect immediately
  rather than being staged behind the settings drawer's Accept: expansion is client
  state, not a setting.

  **"Collapse all" folds to the outermost level, never to nothing**, because a
  collapse hides a group's **descendants** and never the group row itself. Folding
  every group therefore leaves one row per top-level group, plus the grand total —
  so there is always something left to expand back from.

  ```
  Cancelled  Business  Critical            Cancelled ·total·
  Cancelled  Business  ·total·             Active    ·total·
  Cancelled  Retail    ·total·      →      ·total·
  Cancelled  ·total·
  Active     ·total·
  ·total·
  ```

  **Breaking in effect for `flat` grouping, though the API is unchanged.** A row
  could previously fold an ancestor level — `(Berlin)` in a `city › status`
  grouping — that a flat read never emits a row for. Folding it hid every row of
  the group and left nothing behind carrying the control, so the group could not be
  reopened from the grid at all. A group is now foldable only where a row survives
  the fold to undo it, which under `rollup` and `cube` is always its subtotal.
  Under `flat` the chevrons are therefore gone and both new menu items are
  disabled — a flat result has no hierarchy on screen to fold.

  For consumers reading the group tree directly, `resolveTableGroupTree` now also
  returns `foldableGroupPaths`: the one set every chevron, the keyboard fold and
  the two menu items are derived from.

  Focus follows the fold. Collapsing every level at once moves the grid's focus
  target to the top-level group containing the focused row, rather than to whatever
  row shifted into its index — which after a collapse-all is usually the grand
  total.

- bd7b00c: A grouped row can now be expanded and collapsed with a pointer.

  Group expansion has worked since the treegrid slice, but the only thing wired to
  it was the arrow-key handler — so to anyone using a mouse the feature did not
  exist. The hierarchy column now leads with a disclosure chevron that toggles the
  group it sits on, and reserves the same space on rows with nothing to open so
  sibling labels stay aligned. The chevron replaces the decorative group icon that
  used to occupy that spot.

  **The chevron is deliberately not a button.** The grid has a single roving tab
  stop addressed by row key plus column key; a button here would add a second one
  inside a cell that already owns one. Expansion state stays on the row, where
  `aria-expanded` already carries it, and the keyboard path is unchanged —
  `ArrowRight` expands, `ArrowLeft` collapses, exactly as before.

  Adds `DisclosureIcon` to the icon set.

- 41314fe: A grouped Table now renders each group key's value in that key's **own column**
  rather than in a grid-owned hierarchy column, and reads a row's level from which
  key columns are filled rather than from an indent
  ([ADR-080](https://github.com/luciocabrera/vite-react-compiler/blob/main/docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)).

  Four things this fixes, three of them visible before:

  - A `flat` grouping rendered no hierarchy at all — every row sat at the same
    depth and only the innermost key was drawn, so grouping by four keys showed
    one.
  - A `rollup` stated a group's identity _after_ the rows it totalled.
  - A key column had no header of its own, so sorting or filtering by a group key
    had no in-grid home.
  - A lattice result could not be rendered at all, which is why `cube` is absent
    from `TableGroupingMode` while `@lcabrera/server` has emitted it since #574.
    Nothing in the rendering stands in the way now; admitting the mode is separate
    work.

  While grouping is applied the key columns are hoisted to the head of the column
  order and the left pin, in key order, and forced visible. That is a derivation
  and never state — your `columns`, `columnOrder`, `columnPinning` and
  `columnVisibility` are untouched, so ungrouping restores the layout exactly. A
  group key is locked against dragging and hiding while grouped, but keeps its
  width and its header menu.

  **Breaking for anyone reaching past the public surface:** the synthetic
  hierarchy column is gone, along with `TABLE_GROUP_HIERARCHY_COLUMN_KEY` and the
  `table-group-label` test id. A grouped row now paints exactly the columns you
  declared — one cell fewer per row.

- 3ee47e8: A group's path now carries its key **values**, not only their labels.

  `TableGroupKeyValue` gains `readonly value: unknown` beside its existing
  `label`. The label is unchanged and stays formatted — it is what the hierarchy
  column renders, and only the service that read the row can produce it, since
  nothing downstream resolves a path entry back to a column descriptor.

  **Why both.** Formatting is lossy in exactly the direction a query needs. A NULL
  group key renders as `(empty)`, a date as an ISO string, a boolean as `'true'` —
  so a filter built from the label reads `category = '(empty)'` and matches
  nothing, silently, on the group a user is most likely to click into. The raw
  value is what a drill turns back into the restriction the group came from
  (ADR-079). This is the same split `TableGroupAggregateValue` already carries
  after the aggregate fix: the display string and the datum answer two questions.

  **Breaking for anyone building a `TableGroupRowSummary`.** Supply the raw column
  value alongside the label you already produce:

  ```diff
   path: groupedKeys.map((columnKey) => ({
     columnKey,
     label: toGroupLabel(row[columnKey]),
  +  value: row[columnKey],
   }))
  ```

  The summary guard checks `value` for **presence**, not type — `null` is a
  legitimate key and a NULL group is a group, while an entry carrying no `value`
  key at all is malformed and refuses the whole summary.

  **Stored expansion state is unaffected.** `resolveGroupPathKey` still encodes
  `[columnKey, label]` only, so a collapse persisted before this change still
  matches its row. That is pinned by a test rather than left to inspection —
  adding `value` to the encoding would silently re-expand every stored collapse.

- 8460f5b: A grouped row now reads as a total rather than as a styled data row.

  **Aggregates are formatted by the grid, and travel raw.**
  `TableGroupAggregateValue.label: string` is replaced by
  `value: unknown`. A grouped service no longer formats its measures — it passes
  the value through as the database returned it, and the cell renders it with the
  column's own `dataType`, `format` descriptor and locale, exactly as a data cell
  in that column is rendered. A `sum` under a currency column now renders as
  currency instead of as the raw Postgres `numeric` string, and an `avg` honours
  that column's fraction digits. `count` renders as a tally even on a currency
  column, since it answers "how many rows" rather than an amount.

  **Breaking for anyone building a `TableGroupRowSummary`.** Replace each
  aggregate's `label` with `value`, and drop the formatting that produced it:

  ```diff
   aggregates: rows.map(({ columnKey, fn, alias }) => ({
     columnKey,
     fn,
  -  label: formatValue(row[alias]),
  +  value: row[alias],
   }))
  ```

  `path` entries are unchanged and still carry a formatted `label` — a key cannot
  be resolved back to its column client-side, so it has to arrive rendered.

  **The hierarchy label no longer prints the group's row count.** A count belongs
  in the column it aggregates, under that column's header; select a `count`
  aggregate on a column to show it. `TableGroupRowSummary.count` is unchanged and
  still carried.

  **Group, subtotal and grand-total rows now paint on three different grounds**,
  so a total is a different kind of row before its label is read.

- c5e58c8: A table route can declare a default grouping and lock it, and where totals sit is now a user setting that reaches the query.

  `createTableRouteLoader` takes `defaultGrouping`, applied when the URL carries no `grouping` param, and `meta.isGroupingLocked`, which fixes the grouping's shape — keys, mode and per-key granularity — while leaving the aggregates editable. The lock is honoured at every surface that reshapes a grouping, the column-header menu included, not only in the settings drawer.

  Totals placement is chosen in the drawer beside the grouping mode, persists across sessions in the UI-flags cookie, and travels in a `totals` search param so it reaches the emitted `ORDER BY` rather than only the rendering. Absent, it is `last` — the placement the query builder already applied, so a route that never offers the choice emits unchanged SQL.

  One behaviour changes for routes that declare a default grouping: clearing the grouping now writes an explicit empty `grouping` param instead of dropping it, so "ungrouped" survives the next navigation. Routes without a default produce byte-identical URLs.

  `isGroupDrillEnabled` is now resolved from the route's own `meta` alongside the other capabilities, so the persisted UI-flags cookie can no longer seed it — its documented contract all along.

- 80be943: The staged aggregates in the settings drawer's Grouping tab can now be dragged
  into any order.

  Each measure gets a drag handle, the same one the Group Keys, Sort and Column
  Order lists have carried all along — the aggregate list was the only staged list
  in the drawer a user could not reorder. The drag stages like every other edit in
  that drawer: nothing navigates until Accept, and Accept still costs a single
  navigation however many edits were staged. Cancel discards a reorder along with
  the rest.

  The order is real state, not a view preference. It rides in the `grouping`
  search param's `agg` array, so a reordered list survives a shared link and a
  reload — including a move that takes one column's measure above another's, which
  is the case the ordered wire format exists for.

  The order a reorder produces is a **permutation** of what was applied: dragging
  can neither introduce an aggregate nor drop one. That matters for a consumer
  seeding the grouping store from a hand-written loader, where an aggregate on a
  column the route does not declare is staged but not rendered — such an entry
  keeps its place rather than being silently un-staged by someone dragging a row
  they can see.

  Each row keeps its share toggle and its remove control, and two measures on one
  column still remove independently: a row is identified by its `(columnKey, fn)`
  pair, which is also what the reorder names.

- 4f8beaa: A Table column can now carry **several aggregate functions at once**. Applying
  `avg` to a column already showing `min` adds to it rather than replacing it, from
  the settings drawer's "Add Aggregate" panel and from the column-header menu
  alike, and the group rows show both — each named, so two numbers in one cell are
  readable.

  Previously the second selection silently discarded the first, and nothing said
  so. The cap was not an oversight: `TableGroupingState.aggregates` was a
  column-to-function map because that was the shape the compact `grouping` URL
  param could carry, and a state the transport cannot express is a state a shared
  link silently loses.

  **The shapes that changed.** `TableGroupingState.aggregates` and `.shares` are
  now ordered lists of `{ columnKey, fn }` records, as are
  `TableMetaState.groupingAggregates` and `.groupingShares`. On the wire, the
  `grouping` param's `agg` and `share` members are ordered arrays of compact
  `"<columnKey>:<fn>"` strings. A consumer building either of those by hand — a
  route with a `defaultGrouping`, or a hand-written loader seeding the grouping
  store — has to move with them.

  **A link written before this reads as ungrouped.** The old `{"agg":{…}}` map is
  outside the new vocabulary, so it refuses the whole payload and the table opens
  flat — the same whole-state refusal every other unreadable `grouping` param gets,
  rather than a half-applied query. Only the `agg` and `share` members are
  affected; a `grouping` param with neither is unchanged.

  **A share names a measure now, not a column.** `sum` and `count` are both
  shareable, so on a column carrying both, a bare column key could not say which
  measure's percentage was meant. Each measure takes its own share toggle, and
  removing one measure prunes only that measure's share.

  **Order is now state.** The aggregate list keeps the order it was built in, that
  order survives the URL round trip, and it is what the staged list renders. A
  column key containing a `:` round-trips correctly: the token is split on its last
  separator and the suffix checked against the closed function vocabulary.

  Sorting and pinning are untouched. They remain single-valued, and keep the
  shared `deriveToggleCommandState`; the aggregate commands got their own
  derivation beside it rather than widening one that sorting also uses.

- 3523f02: A grouped measure can now be shown as a share of the grand total, with a proportional bar.

  Turn it on per aggregate in the settings drawer. Each group row then shows its measure as a percentage beside the number, at every level of a multi-key grouping — leaves, subtotals, and the grand total reading 100%.

  The share is offered on `sum` and `count` and on no other aggregate. The denominator is derived from the rows the read already returned rather than asked of the server, and that is only correct where adding the parts gives the whole: summing each group's `avg` is not the set's average, and summing each group's `count(DISTINCT …)` counts a value once per group it appears in — which would produce shares that still add to 100% while being wrong several times over. ADR-086 carries the measurements.

  Nothing about a share changes the SQL the route emits, so turning one on costs no round trip. It travels in the `grouping` search param with the rest of the configuration, so a shared link opens showing what its author saw; a link naming a share on an aggregate that cannot carry one is refused whole, as every other illegal member of that param already is.

  An absent or zero denominator renders an explicit absence rather than `0.0%` or `NaN`, and the bar is hidden from the accessibility tree because the value it depicts is already text beside it.

- 4a7d18a: The aggregation surfaces stop offering a second Distinct Count, which a grouped
  read cannot carry.

  `@lcabrera/server` budgets a grouped query at one `countDistinct` — it costs a
  per-group tuplesort redone for every grouping set, so a second one repeats the
  most expensive part of the query — and refuses a read carrying more. Nothing on
  this side knew that, so both surfaces let a user apply `Distinct Count` on one
  column and then on another, and answered the second choice with a refused read
  instead of rows. The refusal rendering was working (ADR-068); the offer should
  never have been made.

  **Withheld rather than offered-and-disabled**, the rule the aggregation commands
  already keep — with one deliberate exception. The column that **carries** the
  distinct count goes on being offered it in its own header menu, because that menu
  toggles and the item is the only way to remove it; a rule applied everywhere
  would strand a user with a measure they could apply from the menu and not clear
  from it. The drawer's picker never sees that exception, since it subtracts what
  the column already carries anyway.

  **Where withholding empties the drawer's function control, the control says
  why** — and says something different from the message a fully-measured column
  gets. "This column has them all" sends the user to this column's measures; "only
  one Distinct Count fits in a grouped read" sends them to whichever other column
  holds one, and names a **cost** rather than a prohibition, which is what the cap
  actually is.

  The rule is a property of the whole request rather than of any column, so it does
  not go into the shared per-column predicate: `resolveOfferableAggregates` is
  unchanged, and `resolveAffordableAggregates` composes on top of it, counting
  every column's aggregates together. A `grouping` URL naming two distinct counts
  is now refused by this package's own sanitizer, whole, rather than travelling to
  the server to be refused there — and the store's seed guard refuses the same list,
  which is the boundary a consumer's own loader reaches directly.

  The published surface gains one constant and loses nothing:
  `MAX_TABLE_COUNT_DISTINCT_AGGREGATES`, beside `MAX_TABLE_GROUP_KEYS` on
  `./components/Table/Table.constants`, so a consumer can read the budget its own
  surfaces have to respect. Every util behind it is internal to the Table and none
  is exported.

### Patch Changes

- 7977fd0: A Table column that is currently a **group key** no longer offers aggregation
  functions in its header actions menu.

  A grouped column renders its key's value rather than a measure
  ([ADR-080](https://github.com/luciocabrera/vite-react-compiler/blob/main/docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)),
  so the aggregate a user picked there was written to the grouping state and then
  dropped by the rendering — the menu item looked broken. The settings drawer's
  "Add Aggregate" picker already left those columns out, so the two surfaces
  disagreed in the same session.

  Both now resolve "may this column be aggregated, and with what" through one
  predicate, `resolveOfferableAggregates`, which composes the loader-shipped
  catalogue's type legality with group-key membership. Each surface still feeds it
  from its own state — the header menu from the applied grouping, the drawer from
  its staged draft — so the picker keeps reflecting an edit that has not been
  accepted yet.

  Suppression follows the menu's existing shape for an illegal command: the
  functions **and** the "No Aggregate" clear item are absent while the column is a
  key, exactly as they already were for a column the catalogue can aggregate in no
  way. Everything else in that column's menu — sorting, grouping, pinning, hiding
  and Manage Column — is unchanged, and removing the column from the grouping
  brings its aggregation items back.

  This constrains what is _offered_ and nothing else. The grouping configuration
  travels in the URL, so a request can still name one column as both key and
  measure; there the key wins, as it already did.

- 24f6cb8: Fixes a crash that emptied a grouped Table to its error boundary — the grid
  vanished and the route showed its load-failure state, for data that had loaded
  fine.

  Three defects composed, and each is fixed on its own terms.

  **A drill row's marker never reached the cell that renders it.**
  `renderTableBodyPinnedGroup` takes one spread object of per-row fields and
  names each one it forwards; `drillRow` was not among them, so it was dropped
  silently — an excess property survives a spread rather than being rejected.
  Every drill chrome row was therefore read as an ordinary data row, and the
  actions column asked it for a primary key it does not carry. That is the crash
  on the first click of a chevron.

  **A malformed structural row was reclassified as data.**
  `getTableGroupRowSummary` and `getTableDrillRow` answer `undefined` both when a
  row is not chrome and when its marker is chrome but unreadable, and the render
  path could not tell those apart. One member that fails to narrow now blanks the
  row instead of turning a group row into a data row. The validators stay strict
  — a group described by some of its keys is not the group the row holds — and
  `hasTableStructuralMarker` answers the separate question of what the row claims
  to be.

  The reachable trigger for that one is serialization: an aggregate whose value is
  `undefined` loses its `value` key entirely to `JSON.stringify`, and the
  presence check that correctly admits `null` then refuses the whole summary.

  **`resolveCrudRowId` no longer throws.** ADR-062 had already drawn this line for
  row keys — a throw is right for a CRUD link, where a bad id must not reach a
  route, and wrong where the same throw empties the table — and the row-actions
  menu, also on the render path, kept the throwing call. It now answers
  `undefined`, and the menu renders nothing for a row with no resolvable id; any
  custom actions still render, since they act on the row rather than on an id. No
  bad id reaches a route either way, which is the guarantee the throw existed for.

  There is no throwing variant left, because nothing wanted one: the menu is its
  only caller. Consumers reaching for it through a deep import get `undefined`
  where they previously got an exception — it is not part of the published
  surface.

- e50618b: The settings drawer's "Add Aggregate" **function** picker no longer offers a
  function the chosen column already carries.

  Since a column began carrying several aggregates at once, adding one has been an
  append with a duplicate guard, so re-picking an applied function was accepted and
  then changed nothing: the aggregate list stayed as it was and no message
  explained why. That is the same shape as the header-menu defect just fixed — a
  control that takes a choice and does nothing reads as a bug — and the house rule
  is that an illegal command is never offered rather than offered-and-disabled.

  The subtraction is a new drawer-owned derivation, `resolveAddableAggregates`,
  composed **on top of** the shared `resolveOfferableAggregates` rather than folded
  into it. The two offering surfaces deliberately diverge here: the picker only
  ever adds, so an applied function is a choice that cannot change anything, while
  the column header menu **toggles** — there the applied item is the only way to
  remove that aggregate, so it must keep being offered. Teaching the shared
  predicate about applied aggregates would have forced one answer on both, and the
  menu would have lost its clear affordance. Legality still comes from the one
  predicate, so neither surface can disagree about which functions a column
  supports at all.

  Clearing an aggregate puts its function straight back in the picker. A column
  that already carries every function its type supports now says so, in place of
  the function control, instead of presenting an empty list — the column list still
  offers such a column, because that list excludes group keys and unaggregatable
  columns, not exhausted ones. The Add button acts on what the picker currently
  offers, so a selection that stops being addable underneath it — the column is
  staged as a group key, or the function gets applied from elsewhere — can no
  longer be submitted.

- Updated dependencies [ae3022a]
- Updated dependencies [dd82183]
  - @lcabrera/api@0.4.0
  - @lcabrera/utils@0.2.0

## 0.3.0

### Minor Changes

- 6bc1d80: **Breaking:** a table route's request-shaping capabilities are declared once, on
  the loader `meta`, and no longer as props on the view (ADR-063).

  `TableRouteView` and `useTableRoutePage` lose `isKeysetEnabled` and
  `isServerFilterEnabled`. Both flags now live on `TableMetaState`, the channel
  `crud` and `deleteActionPath` already use, and the load-more query reads them
  from the loader data.

  **Why.** A capability that shapes the request is needed on both sides of the
  loader boundary: the loader builds the first page, the view builds every page
  after it. A view prop is invisible to the loader by construction —
  `createTableRouteLoader` runs before any component renders — so a capability
  declared as a prop could never be read by the half that builds the first page.
  Declaring it on `meta` puts it where both halves can reach it.

  **What this does not do.** It relocates the declaration; it does not wire the
  loader to consume it. A route's `fetchPage` still decides for itself what the
  first page sends, so a loader that forwards `filters` unconditionally keeps
  doing so whatever the flag says. Making the loader read its own capability is
  follow-up work, and until it lands the two halves of a route must still be kept
  consistent by hand.

  **Migration.** A consumer that passed neither prop does nothing: absent meta
  reproduces the previous `false` default exactly, so the request shape is
  unchanged. A consumer that passed either prop moves it to the loader for the same
  route and deletes it from the component:

  ```ts
  // before — the loader
  export const loader = createTableRouteLoader<Row, RowResponse>({
    /* … */
    meta: { crud: CRUD },
  });
  ```

  ```tsx
  // before — the component
  <TableRouteView<Row, RowResponse>
    fetchPage={fetchRowsPage}
    isKeysetEnabled
    isServerFilterEnabled
  />
  ```

  ```ts
  // after — the loader carries the capability
  export const loader = createTableRouteLoader<Row, RowResponse>({
    /* … */
    meta: { crud: CRUD, isKeysetEnabled: true, isServerFilterEnabled: true },
  });
  ```

  ```tsx
  // after — the component declares only what it alone can supply
  <TableRouteView<Row, RowResponse> fetchPage={fetchRowsPage} />
  ```

  A hand-written loader puts the same two keys on the `metaState` it returns.
  Nothing else moves — both `TableRouteView` and `useTableRoutePage` already
  require loader data of this shape, so every affected consumer has a loader to
  move the flag to. The removed props are a compile error naming the prop, so the
  failure mode at upgrade is a build break, not a silent change of behaviour.

  **One type narrowing comes with that.** `createTableRouteLoader` now resolves
  both capabilities itself, so `metaState.isKeysetEnabled` and
  `metaState.isServerFilterEnabled` are always present and typed `boolean` rather
  than `boolean | undefined`. A consumer only reading `metaState` gains a
  non-optional field and needs no change. A consumer annotating a hand-written
  loader as `TableRouteLoaderData<…>` must declare both keys — which is exactly
  what the migration above already asks that consumer to do.

  **Absent still means off.** A route that declares no capability meta sends
  exactly what one declaring both `false` sends. That was ADR-056's safety
  property — the flags default off so that adopting the generic view cannot change
  a route's request shape by accident — and it is carried over unchanged, because
  sending a `filter` to an endpoint that ignores it appends unfiltered rows to a
  filtered table.

- cffd762: `@lcabrera/ui` gains `toQuerySort` (`@lcabrera/ui/routing/shared/toQuerySort.util`) —
  the sorting counterpart to `@lcabrera/server`'s `toQueryFilters`. It renames a
  table `SortingState` to the `{ column, direction }` shape a paginated endpoint's
  ORDER BY takes, and its result is structurally assignable to that package's
  `QuerySort` with no adapter, so a client-safe package stays out of a Node-only
  one's dependency graph (ADR-039).

  It composes the existing `sanitizeSorting`, so the entries a sort cannot use —
  the UI-only `actions` column, and any column with no direction — are dropped
  rather than defaulted. That keeps the result the same length and order as the
  keyset cursor tuple `toKeysetCursorValues` builds from the same sorting; a
  mismatch between the two costs the cursor and the page falls back to counting
  rows.

  Additive only — no existing export changes.

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

- 12f14dd: Give the Table grid semantics and a keyboard.

  The Table is styled as a CSS grid so that row virtualization works, and that
  takes every row and cell out of the table formatting context — a browser drops
  an element's implicit table role along with its table `display`, so assistive
  technology saw a pile of generic containers. It also had no way to be operated
  from the keyboard.

  The grid now declares its roles explicitly (`grid`, `row`, `columnheader`,
  `gridcell`), reports `aria-rowcount` over the whole dataset and `aria-rowindex`
  as each row's absolute position in it, and announces sort state through
  `aria-sort` on every sortable header. Virtualization spacer rows stay hidden
  from the accessibility tree.

  Exactly one element carries `tabIndex={0}` at any time, so the grid is a single
  stop in the page's tab order and is re-entered where it was left. Arrow keys
  move one cell, `Home`/`End` move within the row, `Ctrl`/`Cmd` with either moves
  to the first or last cell of the grid, and `PageUp`/`PageDown` move by a
  viewport of rows. A move whose target is outside the rendered window scrolls it
  into view first.

  Focus is held as data — a data-derived row key plus a column key — rather than
  read back from `document.activeElement`, so a focused row that scrolls out of
  the virtualization window and back keeps its focus instead of dropping it to the
  document body and silently killing navigation.

  The grid's ARIA attributes are applied after forwarded props, so a consumer
  cannot replace `role`, `scope`, `aria-sort` or `aria-rowcount` by passing one —
  they are the only source of semantics the Table's CSS has stripped, so they are
  a contract rather than a default.

  **Behaviour change for consumers:** the column resize splitter is no longer its
  own tab stop (`tabIndex` is now `-1`). A grid has one roving tab stop, and one
  splitter per column is what that replaces; keyboard access to column width is
  provided by the column's actions menu. Consumers asserting on the splitter's tab
  order, or on the Table's rendered ARIA attributes, will need to update those
  expectations.

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

- bba248b: A read the endpoint **refused** is now visible instead of arriving as an empty
  table, and a group key the database will not accept is no longer offered.

  **The empty body says which of the two things happened.** A table with no rows
  used to give one sentence — "No records match the current view" — which is a
  claim about the filters and is simply false when the database declined to run the
  query. `TablePageResponse` gains an optional `error`, `TableRouteView` defaults
  its new `dataErrorSelector` to it, and the empty body now composes a heading from
  the table's own column label over the endpoint's own sentence: _Grouping by Total
  Amount was refused — Column "total_amount" is not a legal group key:
  too-many-distinct._ The recovery offered follows the same fact: **Clear
  grouping** for a refused grouping, since revalidating sends the same keys and is
  refused again, and **Retry** otherwise — a cancelled or failed read can succeed
  on a second attempt.

  The heading names the column only for `column-not-groupable`, the one refusal
  whose column _is_ the refused group key. A refusal on the estimated row bound
  names the **widest** key rather than the one just picked, an illegal aggregate
  names an aggregated column, and `unknown-column` covers both roles — so those get
  _This grouping was refused_, and the endpoint's sentence names the column in the
  role it actually plays.

  **The grouping menus narrow to the catalogue.** `TableColumn.isGroupable`
  defaults to `true` and is the consumer's declaration; whether a column can
  actually be a group key depends on its real Postgres type and its distinct-value
  statistics, which the loader already ships on
  `TableMetaState.groupingCapabilities`. The header menu's "Group by This" and the
  settings drawer's add-key list now resolve both through the new
  `resolveGroupKeyAvailability`, so a refused column is disabled (with the reason in
  its `title`) or left out rather than offered. An **absent** capability leaves the
  declared answer standing, so a route that ships no capability map is unaffected —
  and a **consumer opt-out wins with no reason attached**, because
  `isGroupable: false` is the table's own decision rather than anything the
  endpoint said.

  A key that is already applied stays removable from the header menu — under a
  refusal and at the depth cap alike — because a URL can seed a grouping the
  catalogue refuses today.

  **New public surface.**

  - `TableResponseError` and `TableGroupingRefusalReason` on `Table.types` — the
    client-safe twin of `@lcabrera/server`'s `SerializableDbError`, duplicated
    rather than imported (ADR-038/039) and pinned in both directions by a contract
    test.
  - `dataErrorSelector` on `TableProps`, `TableLayoutProps` and
    `TableRouteViewProps`; `error` on `TablePageResponse`.
  - `useGetTableDataError` and `TableDataState.error`.
  - `resolveGroupKeyAvailability` and `TABLE_GROUP_KEY_REFUSAL_LABELS`.

  **Behavioural changes a consumer can trip on.**

  - `TableDataState.error` is **required and nullable**, not optional, and
    `getInitialDataState` always emits the key — the provider re-seeds through a
    shallow merge, so an omitted key would leave a stale refusal on screen.
  - A route reading its rows with a custom `dataSelector` should pass a
    `dataErrorSelector` too; without one its refusals stay invisible, exactly as
    before.
  - An endpoint whose fetch **rejects** on a refusal still reaches the route error
    boundary. Return the refusal as data to get the new surface.
  - The clear-grouping recovery dispatches through the grouping write path, so a
    tree rendering a refused grouping needs a `NotificationProvider` (already
    supplied by `AppProviders`). An ordinary empty table needs nothing new.
  - `TableEmptyStateMessage.stylex.ts` is a **new** StyleX module; the existing
    `TableEmptyState.stylex.ts` keeps its path, so no themed variable is renamed.

- 4bb6657: Retire four table seams that were wired to nothing.

  Each was a reader with no writer, a knob with nothing to configure, or a helper
  with no caller — and each sat somewhere a reader would reasonably take for the
  intended home of new table state. Removing them is cheaper than keeping them
  plausible.

  **The `<persistenceKey>-tableState` URL param is gone.** `createTableRouteLoader`
  (via `readTableLoaderStateFromRequest`) decoded a Base64 envelope from that param
  and let its `columnOrder` / `columnVisibility` win over the cookie. Nothing wrote
  it: the persist-cookie flow (ADR-010) gives those two slices no `searchParamKey`,
  and the encoder that could produce the envelope was never part of the package's
  `exports`. Column order and visibility now come from the cookie only, which is
  the channel that has always written them, and `sorting` / `filters` remain the
  URL-borne slices they already were. **Breaking if you hand-wrote that param** —
  there was no supported way to produce it, and the loader now ignores it.

  **`columnOverscan` is gone from `TableMetaState`**, along with the
  `DEFAULT_COLUMN_OVERSCAN` constant on `./components/Table/Table.constants` and
  the matching `getInitialMetaState` option. The table virtualizes rows, not
  columns; every column in view is rendered, so an overscan count for them
  configured nothing. **Breaking if you set it** — the field is a compile error
  naming itself, and there is no replacement, because there was never a behaviour
  behind it. Row overscan (`overscan` / `DEFAULT_OVERSCAN`) is untouched.

  **Three column selectors and one meta selector are gone** —
  `useGetEffectiveColumns`, `useGetNormalizedColumnFilters`,
  `useGetStaticColumnKeys` and `useGetTableColumnOverscan`. None was reachable from
  outside the package: the selector barrels never exported them and no `exports`
  subpath reaches them. The state they read is untouched, so a selector can be
  reintroduced the day something renders from it.

  **The `getTotalVisibleColumnCount` helper is gone.** It computed a spacer-row
  `colSpan`; `SpacerRow` derives that itself from `useGetPinnedColumnPartition`.
  It was module-internal and had no `exports` subpath.

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

- d58fe17: Drop the unconsumed `key` field from `createTableRouteLoader`'s loader data.

  The factory returned `key`, a concatenation of the `sorting` and `filters` URL
  params, with a comment stating that React Router remounted the Suspense boundary
  from it. Nothing read it — not `useTableRoutePage`, not `TableRouteView`, not any
  route component — and React Router reads no loader field by that name. The
  remount it described already happens for a different reason: a navigation re-runs
  the loader, so `TableDataResolver`'s `use()` receives a promise it has not seen
  and suspends again.

  It was also defective on its own terms: the two params were concatenated with no
  delimiter, so distinct sort/filter pairs could produce the same string.

  **Breaking if you read it.** `TableRouteLoaderData` is inferred from the
  factory's return, so the field is gone from the type for every table route at
  once. A consumer destructuring `key` from `useLoaderData` no longer compiles.
  Nothing in this repo did, and there is no replacement to migrate to — the value
  was never wired to anything.

- 4912086: The Table can group rows server-side by one column, end to end.

  A route opts in with one flag on its loader `meta` — `isGroupingEnabled: true`,
  the same channel `crud`, `isKeysetEnabled` and `isServerFilterEnabled` already
  use (ADR-063). From that flag, `createTableRouteLoader` reads a `grouping` search
  param, sanitizes the keys against the route's own columns, seeds the table's
  grouping state, and hands the keys to the route's `fetchPage` alongside the
  filters and effective sort it already receives. Absent means off: a route that
  declares nothing ignores the param entirely.

  **What ships**

  - `isGroupable` joins the column capabilities resolved by
    `resolveColumnCapabilities`, defaulting to `true` like its siblings, so a route
    marks a column ungroupable rather than marking every other one groupable. The
    row-actions column declares `isGroupable: false` for itself.
  - A `grouping` search param in the same plain compact JSON as `sorting` and
    `filters` — `{"keys":["order_status"]}` — so a grouped view is shareable and
    restores in a fresh tab (ADR-061). It rides the existing persist-cookie flow;
    no new route and no new mechanism.
  - A grouping store on the Table's **config** context, with
    `useGetTableGroupingKeys` and `useSetTableGrouping`. It is on the config
    context deliberately: a grouping change causes a navigation, and the data
    context is re-created by that navigation, so state placed there would be wiped
    by its own effect.
  - Two commands in the column header menu — "Group by This" and "Clear Grouping" —
    rendered only when the route declared the capability, with `GroupRowsIcon` and
    `UngroupRowsIcon` added to the icon family.
  - `TableGroupHeaderRow`, which renders one group as an ordinary body row. It
    composes `TableRow`, so it paints at the store's `rowHeight` and the
    virtualization window arithmetic holds unchanged under grouping.
  - `TableGroupRowSummary` / `TableGroupRow` and `TABLE_GROUP_ROW_FIELD` — the
    contract a route's grouped read writes and the table reads. The renderer asks
    each **row** whether it is a group rather than asking the configuration, so a
    group row and a detail row can arrive in the same result.
  - Row identity for group rows, derived from the group's own key and value with a
    third disjoint prefix, so a grouped result does not fall back to positional
    keys (ADR-062).

  **A malformed `grouping` param yields a flat table, not a half-applied query.**
  The codec admits one member named `keys` holding strings and refuses the whole
  payload for anything else; the loader-side sanitizer then refuses the whole list
  if one key is not a groupable column of that route, or if a key repeats. Key
  order is the query's nesting order, so dropping one key silently would answer a
  different question from the one the URL describes.

  **Additive for existing consumers.** A route that declares no grouping meta
  renders the same header menu it did before, returns the same loader fields, and
  sends the same request. `TableMetaState` gains two optional members
  (`groupingKeys`, `isGroupingEnabled`) and `TableColumn` one (`isGroupable`);
  `resolveColumnCapabilities` returns one more resolved flag, which is a widening
  for anything destructuring it.

  **Not in this release:** multi-key grouping, choosing aggregates, rollup and cube
  emission, expanding and collapsing groups, and the settings-drawer section. The
  grouped read applies a fixed `count(*)` per group.

- bd3b6a8: Let a grouped Table expand and collapse, and announce itself as a tree.

  A grouped result rendered every level at once and could not be folded, so a deep
  grouping was unreadable on screen and unusable from the keyboard. Group rows now
  expand and collapse, and the grid upgrades to `role="treegrid"` while its rows
  are a tree.

  Expansion is keyed by **group path**, never by row index. That is what lets it
  be re-applied after the loader re-runs: a sort change reorders rows without
  touching any group's key values, so every collapse survives it, while a filter
  change that removes a group drops that path rather than leaving it to
  re-collapse the group later if a filter brings it back. It is client state and
  does not travel in the URL, so a shared link carries the analysis and not the
  reading position.

  The tree defaults to fully expanded. A grouped read returns whole, so every
  level is already in memory by the time the grid paints it — collapsing by
  default would hide data that has already been fetched and save nothing.

  Every row of a tree states its `aria-level`, `aria-posinset` and `aria-setsize`,
  group rows and detail rows alike, and `aria-expanded` appears only on a row that
  actually has children. A row's level comes from its group's own path rather than
  from its position among the rows. `ArrowRight` expands a collapsed group and
  `ArrowLeft` collapses an open one; on a row already in that state both keys stay
  ordinary cell navigation, so nothing is lost and the fallback is one more press.

  Collapsing changes the row count and never the row height, so the virtualization
  height invariant holds in both states: `<tbody>`, both spacers, `aria-rowcount`,
  every `aria-rowindex` and the focus model's row index all count the rows a
  collapse leaves standing. When a collapse hides the row holding focus, focus
  moves to the collapsed group row — its nearest surviving ancestor — rather than
  to whatever row shifted up into the vacated index, which is usually a row in a
  different group.

  **For consumers:** a grouped Table's `role` is now `treegrid` rather than
  `grid`, and its `aria-rowcount` counts visible rows while grouping is applied.
  Tests querying `getByRole('grid')` against a grouped table, or asserting a row
  count over the whole dataset, need updating. An ungrouped Table is unchanged in
  every respect, down to the rendered markup.

- 46358a0: Make the package resolvable, and give it a deliberate public surface.

  **The package could not be imported.** Its `exports` map carried eight wildcards
  (`./components/*`, `./contexts/*`, `./hooks/*`, `./routing/*`, `./types/*`,
  `./utils/*`, `./entry/*`, `./design-system/*`), and a wildcard target is not a
  file: `./components/*` → `./src/components/*` maps `components/Button` to a
  _directory_, and `components/Table/Table.types` to a path with no `.ts` on it.
  `exports` resolution does no extension search and no directory-index lookup, so
  neither resolves. Because the package ships source, its own files self-referenced
  through that map — so importing even the bare entry produced 105 unresolved
  modules from inside the package.

  **Internals now resolve through `#ui/*`**, declared in the new `imports` field.
  A `#` specifier is package-internal by specification, so it is invisible to you
  and cannot become accidental public API.

  **`exports` now names every public subpath explicitly**, each mapped to a
  concrete file, with no wildcard. If you imported a path that is not listed, it
  never resolved for you in the first place — this cannot break a working import.
  The `api-surface` snapshot went from 19 tracked subpaths to 61 as a result.

  **One change to your build config**, and it is a removal. The StyleX plugin no
  longer needs the alias the README used to prescribe:

  ```diff
  - stylex.vite({
  -   aliases: { '@lcabrera/ui/*': [`${uiSrc}*`] },
  -   useCSSLayers: true,
  - }),
  + stylex.vite({ useCSSLayers: true }),
  ```

  The alias existed to paper over the broken map; `#ui/*` resolves through the
  package's own manifest instead. Everything else about consuming the package is
  unchanged — you still compile its source and still run the StyleX plugin over it.

### Patch Changes

- 9e92e69: The table settings drawer's Grouping tab stages its edits and applies them on
  Accept, like every other section in that drawer.

  Previously each edit wrote the live grouping store as it was made. Two things
  followed: **Cancel did not cancel** — the edits were already applied — and,
  because grouping configuration is URL state, every toggle wrote the `grouping`
  search param and re-ran the loader, so expressing one intent with five edits
  cost five navigations and five grouped queries.

  **What changes**

  - Adding, removing or reordering a group key, adding or removing an aggregate,
    and the section's Clear button all write a drawer-local draft. Nothing
    navigates until Accept.
  - **Accept applies the whole grouping configuration in exactly one navigation**,
    however many edits were staged. It rides in the same persistence write as the
    staged column state, because both submit through one fetcher and a second
    submission would abort the first.
  - Cancel restores the grouping the table had when the drawer opened, with no
    navigation and no loader run. Re-opening the drawer shows the live grouping.

  **What is unchanged**

  - The column-header grouping menu still applies immediately. It is a direct
    action with no Accept to wait for, and that was never the problem.
  - The `grouping` search-param shape, the URL contract and the grouped query are
    untouched.

  **For a consumer calling the internals directly**

  None of the following is reachable from a published entry point — the `exports`
  map has no path into `components/Table/contexts/TableConfig/grouping`, and
  `components/Table`'s barrel re-exports only `Table` plus a curated type list —
  so a consumer on the documented surface is unaffected. A consumer reaching past
  it by deep import is not:

  - `useBatchSetTableSettings` now takes `{ grouping, settings }` rather than the
    settings object alone, so the one Accept write can carry both.
  - `useSetTableGroupKeys` and `useGetTableGroupingAggregates` are removed. The
    drawer was their last caller and it now stages instead. The live store keeps
    `useToggleTableGroupKey`, `useSetTableColumnAggregate`,
    `useClearTableGrouping`, `useGetTableGroupingKeys` and
    `useGetTableColumnAggregate`, which the column-header menu still uses.

- 5420afb: Table actions menus match the settings drawer's surface, and their section rules
  are evenly spaced.

  Both menus built on `TableActionsPopover` — the column-header sort/pin/hide menu
  and the row-actions menu — rendered on a hardcoded opaque `#0f172a` panel that
  explicitly opted out of the glass treatment (`backdropFilter: 'none'`), so a menu
  opened next to the settings drawer read as a different material entirely. The
  panel now composes `surfaceStyles.glassPanel`, a new recipe holding the blur +
  translucent fill that `SidePanel` previously inlined; `SidePanel` composes the
  same recipe, so the two cannot drift apart. Its border moves to `borderPrimary`
  to match the drawer's chrome.

  Section rules were a `border-top` on the first item of the following section,
  which left roughly 8px of space above the rule and none below it. They are now
  `TableActionsPopoverSeparator` elements — standalone flex children, so the
  menu's own `gap` spaces them equally on both sides. Consumers passing
  `customActions` to `TableRowActionsMenu` get the same rule above their content
  as before, with symmetric spacing.

  `SidePanel` renders identically; the recipe extraction is a refactor.

- 5ca4fa2: Table body rows are keyed by data, not by array position.

  Every body row was keyed by its index in the data array, so React reused a row's
  DOM node for whatever row happened to land at that position after a sort, a
  filter or a virtualization scroll. Rows now take their key from the columns
  marked `isPrimaryKey`, which is what makes a row's identity survive a reorder —
  the prerequisite for stable focus, selection and grouping.

  Deriving a key can fail: a table may declare no primary key, a primary-key value
  may not be a scalar, or it may be a non-finite number. Each of those degrades to
  an index-derived key rather than throwing, because a key is needed for every row
  on every render and a throw on the render path would empty the whole table. The
  two kinds of key are prefixed distinctly, so a row whose primary key is literally
  the text of some row's index stays distinguishable from that row.

  Keys are built with `JSON.stringify` rather than by joining encoded values, which
  matters for three kinds of id: one containing an unpaired surrogate (which
  `encodeURIComponent` rejects outright), a composite id whose values contain the
  delimiter, and an id column that arrives as numbers on one page and strings on
  another. Any of the three would otherwise produce a crash or two rows sharing a
  key.

  A table whose columns declare no primary key is unchanged: its rows keep exactly
  the positional identity they had.

- 7732e5f: The tooltip arrow now carries the tooltip's own border. It was a bare filled
  square, so the surface outline stopped at the box edge and the tip below it read
  as a detached triangle.

  Each placement borders only the two edges that end up outside the tooltip body;
  the two buried under it stay borderless so no seam shows through.

- b1d963b: URL state params are now read back through a codec with an explicit **refusal
  contract**: a param the codec does not recognise yields no state at all, rather
  than partly applied state or a value typed as valid while holding something
  else.

  This changes what a malformed or hand-edited URL does, so it is worth knowing
  before upgrading. The behaviour is unchanged for every param this library
  produces — only params that never round-tripped through it are affected.

  - **`sorting`** — a direction outside `asc`/`desc` used to be cast straight to
    the compact sorting type with no check, so `?sorting={"name":"asc","age":"x"}`
    produced two sort entries and `age`'s direction was typed as a valid direction
    while holding `"x"`. It now yields an unsorted table. The whole sort is
    dropped, including the entries that were fine, because a half-applied sort
    reorders a shared link's rows while still looking like the sort that was
    linked.
  - **`filters`** — a param that is not a column-keyed object is now refused
    whole. Previously a JSON array such as `[["ct","hello"]]` was read with array
    indexes as column keys, producing a filter on a column named `0`. Inside a
    recognised object, an unrecognised filter value still drops just that column,
    as before.
  - **`<persistenceKey>-tableState`** — a Base64 payload that decodes to an array
    or a scalar is now refused. Previously it was returned as if it were a state
    object.

  Undecodable Base64, malformed JSON and unrecognised tokens all degrade to the
  declared fallback instead of throwing, so a hand-edited URL never fails a loader.

  **A debug-log leak is closed at the same time, deliberately.** These readers each
  used to pass the caught error to `logger.debug`, and V8 embeds the input in a
  `JSON.parse` SyntaxError message — so a malformed param echoed its leading
  characters into the log, and `filters` carries user-entered text. The log now
  records the failure _kind_ (`SyntaxError`, `InvalidCharacterError`) beside the
  codec name, and never the value. This is fixed here rather than separately
  because consolidating three readers into one codec put all three call sites on a
  single line. It was only ever reachable in a debug-enabled non-production build,
  since `logger.debug` compiles to a no-op under `import.meta.env.PROD`.

  Consumers using the exported helpers unchanged need do nothing. Anyone
  constructing these params by hand should make sure the values match the
  documented compact shapes, since a near-miss is now dropped instead of partly
  honoured.

- 7a32aa5: Fix two `VirtualSelect` dropdown defects.

  The dropdown no longer renders in the viewport's top-left corner when it is the
  operator picker in the Table column-settings drawer. `customStylex` is now
  composed **before** the dropdown's own positioning styles, so it can never
  override where the list goes — a popover that is not absolutely positioned still
  sits in the top layer, where it lays out against the initial containing block
  rather than its trigger. The floating variant's surface styling (elevation,
  borders, padding) is composed **before** `customStylex` and stays overridable, so
  this restricts placement only.

  Scrolling the option list no longer closes the dropdown. The dismiss-on-scroll
  listener runs on `window` in the capture phase, which puts it on the path of a
  scroll from every element — including the list itself — so it now ignores
  scrolls originating inside the dropdown. `VirtualList` scroll containers also set
  `overscroll-behavior: contain`, so reaching the end of the list no longer chains
  the scroll to the surrounding drawer, and dismissal dispatches a close rather
  than a toggle, which a busy list used to suppress.

- ea57e69: Radio option cards now carry the same surface as the settings drawer's draggable
  rows — a translucent fill that lifts on hover — instead of sitting transparent
  with no pointer feedback. The keyboard focus ring that `appearance: none` had
  stripped from the radio input is restored.

  That surface was written out verbatim in `DraggableListItem` and `FilterItem`; it
  is now the shared `surfaceStyles.interactiveCard` recipe, exported from
  `@lcabrera/ui/design-system/tokens/surfaces.stylex`. The draggable row's emitted
  CSS is unchanged; the filter item gains the fill/border transition it was missing.

  Affects every `RadioOptionGroup` consumer: the pin-side and conflict modals, the
  Settings radio sections, and `RadioField` in the Form builder.

- Updated dependencies [5af634d]
- Updated dependencies [e8cc16d]
- Updated dependencies [8bb2a24]
  - @lcabrera/api@0.3.0
  - @lcabrera/utils@0.2.0

## 0.2.0

### Minor Changes

- ff2c9cb: **Breaking:** `AppProviders` reads the root loader's `theme` and `globalSettings`
  itself, and loses the `initialTheme` and `globalSettings` props that used to
  carry them. It is the only component that consumed those values, so a caller
  reading them existed purely to name them again — the same call
  `PATTERNS.md` §"Thin Shell + Self-Connected Delegates" makes everywhere else in
  the package.

  Nothing changes for an app on `RootComponent`, which is where this seam lived.
  A hand-composed root drops the two props:

  ```tsx
  // before
  <AppProviders appId={APP_ID} globalSettings={globalSettings} initialTheme={theme}>

  // after — AppProviders reads both from the root loader
  <AppProviders appId={APP_ID}>
  ```

  `useLoaderData` returns `undefined` for a route with no loader, so a root route
  without one still falls back to `defaultTheme` rather than failing. The loader's
  shape is unchanged: `getRootLoaderData` (`@lcabrera/ui/routing/shared`) already
  returns a superset of what is read.

  The type describing that shape moved with the read and was renamed to match its
  new owner — `RootComponentLoaderData`
  (`@lcabrera/ui/components/RootComponent/RootComponent.types`) is now
  `AppProvidersLoaderData`
  (`@lcabrera/ui/components/AppProviders/AppProviders.types`). Neither name is
  exported from the package root.

- fbf9d05: `dataTotalSelector` may now return `undefined`, and the Table keeps the total it
  already holds when it does. The total of a filtered set cannot change within a
  scroll session, so re-counting it on every load-more page is work with a known
  answer — a server can now count once, on the first page, and omit it thereafter.

  Existing selectors are unaffected: returning a `number` (including `0`) still
  sets the total exactly as before, and a table with no selector still falls back
  to the number of loaded rows.

  `Pagination` also gains an optional `lastRow` and a `TData` type parameter
  (defaulting to `unknown`, so a bare `Pagination` still means what it did).
  `onLoadMore` now receives the last row the table holds, which is what a keyset
  data source needs to resume from — `skip` cannot express "resume after this
  row", and only the consumer knows which of the row's fields make up its sort
  key. Prefetched pages carry the same anchor, so they stay in step.

- ada5115: **Breaking:** the application navigation sidebar is now permanent. `AppNavigation`
  always renders as a pinned `<aside>`, so the pin/unpin toggle, the close button
  and the floating launcher rail are gone, along with the `defaultIsPinned` prop
  and the `navigation.pinned` global preference (its Settings → Navigation section
  included).

  Primary navigation is the one control that must never be more than a click away,
  and unpinning could leave a route with no visible way back — the launcher was a
  second affordance existing only to undo the first. Collapsing still works and is
  the supported way to reclaim horizontal space: the panel narrows to an icon rail
  instead of disappearing.

  Removed from the public surface: `GlobalNavigationPinnedPreference`,
  `NAVIGATION_PINNED_PREFERENCE_OPTIONS`, `useGetGlobalNavigationPinnedPreference`,
  and the `pinned` field of `GlobalNavigationPreferences`. A stored settings cookie
  that still carries `navigation.pinned` is not an error — the field is ignored on
  read, so existing users keep their collapsed/size preferences and simply get the
  docked sidebar.

  `SidePanel`'s own `isPinned` prop is untouched; the Table settings drawer still
  pins and unpins as before.

- b58fb6b: Add `RootComponent` — the whole root route of a consuming app in one component.
  It reads the root loader's data, composes `AppProviders` and renders `AppShell`,
  so an app supplies only what genuinely depends on the app: `appId`,
  `defaultTheme`, `getNavigationItems`, `isAuthEnabled` and an optional
  `logoutRoute`. Same reasoning as `hydrateApp` and `createHandleRequest` one layer
  down — the root was the last seam every app had to reproduce correctly before
  the shell would work at all.

  **Breaking:** the navigation subtree no longer drills consumer configuration
  through components that never read it. `AppShell` and `AppNavigation` lose
  `getNavigationItems` and `sessionActions`, and the `NavigationSessionActions`
  render-prop type is gone. Both values now travel through the new
  `AppConfigContext` (`@lcabrera/ui/contexts/AppConfigContext`), which also carries
  `isAuthEnabled` and `logoutRoute`.

  Migrating a hand-composed root — either adopt `RootComponent`, or wrap the shell:

  ```tsx
  <AppConfigProvider
    getNavigationItems={getNavigationItems}
    isAuthEnabled
    logoutRoute='/logout'
  >
    <AppProviders appId={APP_ID}>
      <AppShell />
    </AppProviders>
  </AppConfigProvider>
  ```

  The session control now ships with the package. An app that passes
  `isAuthEnabled` gets a logout control in the navigation footer, POSTing a
  `<Form>` to `logoutRoute` (default `/logout`) — it no longer has to write one and
  pass it in. It also picks up the navigation's density preference, which the
  hand-written controls did not.

  `AppConfigContext` carries a plain value rather than a store: none of it changes
  for the lifetime of the app, so there is nothing to subscribe to. See ADR-053.

- f82008a: **Breaking:** the Table renders **square corners by default**. The
  `borderRadius.lg` it always applied to its outer card is now opt-in behind a new
  `isRounded` meta flag, so a table drops into a surrounding card, panel or split
  pane without a rounded edge floating inside a square one — the case that
  previously had no answer short of overriding the package's styles.

  Consumers that want the previous look pass the flag through `metaState`:

  ```tsx
  // before — always rounded
  <TableLayout columnsState={columnsState} metaState={{ persistenceKey: 'orders' }} />

  // after — opt in to keep the rounded card
  <TableLayout
    columnsState={columnsState}
    metaState={{ isRounded: true, persistenceKey: 'orders' }}
  />
  ```

  `isRounded` joins `isBordered` and `isStriped` as a presentation flag on
  `TableMetaState`, readable anywhere in the tree via the new
  `useGetTableIsRounded` selector (`@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors`).
  It is not persisted to the cookie: it is a consumer-chosen layout decision, not
  a user preference the table lets you toggle at runtime.

### Patch Changes

- Updated dependencies [fbf9d05]
  - @lcabrera/api@0.2.0

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
  - @lcabrera/api@0.1.1

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
  - @lcabrera/api@0.1.0
