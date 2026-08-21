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
