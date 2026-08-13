---
'@lcabrera/ui': minor
'@lcabrera/server': minor
---

**Breaking:** a grouped grid renders a hierarchy column instead of a spanning
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
