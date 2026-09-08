---
governs:
  - ui
---

# ADR-112 — A grouped grid drops the row-actions column

**Status:** Accepted

**Corrects:** [ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md), whose one exception this removes.

## Context

[ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) narrowed
the painted column list, while a grouping names at least one declared key, to the
group keys and the measures — with one exception. The row-actions column was kept,
reasoned as "not a data column: its cell is the grid's own affordance rather than a
field of the row, so a grouped grid keeps its row menus".

That reasoning holds for the column. What it assumed about the rows turned out not
to be true anywhere else in the design:

- `resolveGroupCellChildren` returns an empty cell for the actions column on a
  **group** row, because a group is not a row anything can be done to.
- A **detail** row is the only row that would carry the menu, and a grouped read
  does not return one. `Table/ARCHITECTURE.md` records this as a known limitation
  in its own right — "a detail row arriving in a grouped grid renders blank" — and
  [ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md)
  is where a group's own rows are opened instead: a route that applies no grouping,
  where the declared columns are all present.

So the kept column painted an empty 32px strip down the right of every grouped
grid, under a header the layout hides, for the entire life of the feature. The
exception was carrying a case the rest of the design had already routed elsewhere.

## Decision

**`withGroupedColumnScope` keeps the group keys and the measures, and nothing
else.** `ACTIONS_COLUMN_KEY` leaves its scoped-key set, so while a grouping is
applied the actions column is not painted, not measured for pinning offsets, and
not listed by the drawer's Columns tab.

**The group-cell resolver loses the branch that answered for it.**
`resolveGroupCellChildren` no longer tests for the actions column: no such column
reaches it. `EMPTY_CELL` stays, because the structural resolver above it still
returns one for a carried group key.

**Ungrouping restores it, unchanged.** The scope is a derivation over the declared
list, never state written back to it — the property ADR-096 chose it for.

## Consequences

**A detail row in a grouped grid loses the one thing it could still do.** Before
this, a row that arrived alongside group rows painted blank cells but kept its
menu; now it paints blank cells and no menu. That is a narrowing of an already
broken case, not of a working one — every other column of such a row was already
dropped by ADR-096 — and ADR-087's drill-down route is where those rows are meant
to be acted on. `Table.groupedCrud.test.tsx` pins the new answer the way it pinned
the old one.

**A consumer whose grouped read does return detail rows has to change route.**
There is no flag to keep the column. If that case turns out to be real, the fix is
to decide it on the presence of detail rows in the payload rather than to restore
a column that is empty in every other grouped view.

**One less column of horizontal budget is spent on nothing.** The visible win, and
the reason this was reported.

## Alternatives considered

1. **Keep the column but hide it when the data holds no detail row.** Rejected:
   the column list is derived from the declared columns and the grouping, and
   nothing else — threading the payload into that derivation would make the painted
   layout shift as rows load, and would put a data dependency into the one
   derivation ADR-096 keeps free of state.
2. **Keep the column only under `flat` grouping.** Rejected on the same evidence
   that prompted this: neither mode's read returns detail rows, so the mode does
   not discriminate. It would leave the empty strip in half the grouped views and
   look arbitrary in the other half.
3. **Leave it as it is.** Rejected: an affordance that can never fire is worse than
   a missing one, because a reader takes it as a promise the grid does not keep.

## References

- [ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) — the scope this corrects
- [ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md) — where a group's rows are acted on
- [#1113](https://github.com/luciocabrera/lcabrera-stack/issues/1113)
