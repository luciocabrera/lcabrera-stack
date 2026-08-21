---
'@lcabrera/server': minor
'@lcabrera/ui': major
---

Each aggregate selected on a grouped Table now renders as **its own column**,
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
