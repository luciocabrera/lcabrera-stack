---
governs:
  - ui
---

# ADR-099 — The staged aggregate list orders the measure columns, and a column's measures stay contiguous

**Status:** Accepted

**Issue:** [#1048](https://github.com/luciocabrera/lcabrera-stack/issues/1048)

**Extends**
[ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) — the
derivation chain that decides which columns a grouped grid paints. This adds the
step that decides what order they sit in.

## Context

`TableGroupingState.aggregates` is an ordered list. The order is the user's: the
settings drawer's Grouping tab renders one draggable row per entry and
`useReorderColumnAggregates` permutes the list, `toAggregateItems` lists it
verbatim rather than re-sorting by column, and the order travels in the
`grouping` search param's `agg` member so it survives a reload and a shared
link. The type's own comment says what that order is for: "listing/render
order; it shapes no SQL".

The grid did not read it. `withAggregateColumns` builds each measure and returns
`columns.flatMap((column) => derivedBySource.get(key) ?? [column])` — every
measure lands in the slot of the column it measures, so the painted order across
columns is the **declared** column order and the staged list only ever decided
the order _within_ one column. A table declaring `order_no` before
`total_amount` therefore painted `Count of Order #` first no matter where the
user dragged it, while the drawer three feet away listed it last. Two surfaces,
one list, two answers.

The constraint on any fix is the header band. `resolveHeaderBands` groups
**adjacent** columns sharing a `headerGroupLabel`, deliberately: a band is a
visual span and cannot cover two columns with a third between them. A measure's
visible header is the function alone — `Average` — with the source column named
once in the band above it. So measures of one column that are not neighbours
lose the only thing that says what they measure.

## Options considered

1. **Sort the aggregates list by declared column order at the point of staging.**
   Rejected: it deletes the user's arrangement rather than honouring it, and the
   drawer's own listing would have to be re-sorted to match, undoing #832.
2. **Order the painted measures by the staged list, position by position.**
   Rejected on the band: a list staging `min(amount)`, `count(id)`,
   `max(amount)` paints `amount`'s two measures either side of `id`'s, and
   `resolveHeaderBands` then draws two `Amount` bands with an `Id` band between
   them. The header stops reading as a report.
3. **Order by the staged list, ranking each measured column by its first entry,
   and keep that column's measures together.** _Chosen._

## Decision

A fourth derivation step, `withAggregateColumnOrder`, runs inside
`getPinnedDerivedColumnsState` between `withGroupedColumnScope` and
`withGroupedColumnLayout` — after the scope has narrowed the list to group keys,
measures and the row-actions column, and before the layout hoists the keys.

It ranks each measured column by its **first** entry in `aggregates` and keeps
that column's measures in list order within the block, then lifts every measure
key out of `columns` and `columnOrder` and splices the ranked run back in at the
index the first measure held. It rewrites nothing else: pin membership decides
which of the three regions a column lands in, and `getEffectiveColumns`
reassembles them from the _ordered_ list, so pin-list order never reaches the
paint.

It returns its inputs untouched when no aggregate is staged or when the grouping
names no declared column, so an ungrouped grid is unchanged — the reordering is
a property of the grouped, report-shaped view and of nothing else.
`withAggregateColumns` is unchanged: it still builds the measures, and no longer
decides where they sit.

The settings drawer's Columns tab follows for free. `resolveRenderedColumnKeys`
runs the same `getPinnedDerivedColumnsState` over its own draft, so the tab and
the grid answer the ordering question once.

## Consequences

**A grouped grid's painted column order changes.** A consumer whose grouping
staged measures across more than one column sees them move on upgrade. Nothing
persisted changes — the derivation writes no state — so the move is undone by
re-dragging the aggregate list, which is now the one control that decides it.

**An interleaved list does not paint interleaved.** Staging
`min(amount)`, `count(id)`, `max(amount)` paints `min, max, count`: the `amount`
block moves whole to its first entry. That is the band constraint made visible,
and it is a real surprise for a user who dragged one row expecting it to land
between two others. The drawer still lists what they staged, so the two
surfaces disagree in exactly this one case — a cost accepted because the
alternative breaks the header.

**A fourth step in a chain whose order is load-bearing.** Placing it before the
scope would rank measures the grouping has not kept; after the layout it would
re-sort the hoisted group keys. The chain now has three adjacency constraints
rather than two, and `getPinnedDerivedColumnsState` is the only place that
records them.

## Alternatives considered

Recorded as _Options considered_ above, since the decision was a choice between
three comparable designs rather than one design answering objections.

## References

- [#1048](https://github.com/luciocabrera/lcabrera-stack/issues/1048) — the
  report, with the screenshots of the drawer and the header disagreeing.
- [ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) —
  the scope step this sits after.
- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the layout
  step this sits before.
- `packages/ui/src/components/Table/ARCHITECTURE.md` — the Layout section, which
  states the chain and its order.
