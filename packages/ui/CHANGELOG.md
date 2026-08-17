# @lcabrera/ui

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
