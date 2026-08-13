---
'@lcabrera/ui': minor
---

A read the endpoint **refused** is now visible instead of arriving as an empty
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
refused again, and **Retry** otherwise.

**The grouping menus narrow to the catalogue.** `TableColumn.isGroupable`
defaults to `true` and is the consumer's declaration; whether a column can
actually be a group key depends on its real Postgres type and its distinct-value
statistics, which the loader already ships on
`TableMetaState.groupingCapabilities`. The header menu's "Group by This" and the
settings drawer's add-key list now resolve both through the new
`resolveGroupKeyAvailability`, so a refused column is disabled (with the reason in
its `title`) or left out rather than offered. An **absent** capability leaves the
declared answer standing, so a route that ships no capability map is unaffected.

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
