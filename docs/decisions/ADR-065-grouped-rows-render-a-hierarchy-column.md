# ADR-065 — A grouped grid renders its hierarchy in a grid-owned column, not a spanning banner

- **Status:** Accepted
- **Date:** 2026-08-13
- **Scope:** `@lcabrera/ui` — `src/components/Table/` group rows and the cell grid they share with detail rows
- **Issue:** #647 — constrains #570, #571, #648 and #651
- **Related:** [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) (grid roles, roving focus, row identity), [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (where grouping configuration and expansion live), [ADR-059](./ADR-059-aggregation-is-builder-generated.md) (what a grouped read returns), [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) (which aggregates a column may offer)

## Context

A group row is rendered today as a **spanning banner**.
[`TableGroupHeaderRow.component.tsx`](../../packages/ui/src/components/Table/TableGroupHeaderRow/TableGroupHeaderRow.component.tsx)
composes `TableRow` and puts one
`<td colSpan={leftPinnedCols.length + centerCols.length + rightPinnedCols.length}>`
inside it, holding an icon, one text segment per group key, one per selected
aggregate, and the row count in parentheses. The row therefore has exactly one
cell, and that cell is presentational — it carries no `role="gridcell"`, so
`Table.groupedGridSemantics.test.tsx` pins the count of gridcells in a grouped
body at "one per **detail** row and column, groups contributing none".

That was the right shape for the slice that produced it. #568 grouped by exactly
one key and applied a fixed `count(*)`, so there were no per-level measures to
align under anything, and a banner was the smallest thing that worked. It should
not be read as a decision — nothing chose it over the alternative, because the
alternative had no reason to be considered yet.

Multi-key grouping (#569 / #646) changed the premise, and rollup (#570) removes
it entirely. The other candidate shape is a **hierarchy column**: the group label
occupies one designated column, indented by depth, while every other column
renders that group's aggregate in its own cell under its own header. Group rows
and detail rows then share one cell grid.

Reference designs for the second shape were reviewed for this decision in two
forms: a flat `GROUP BY ROLLUP (region, country)` result whose subtotal rows
carry aligned `revenue` / `orders` / `avg order` values, and a four-level
expandable tree whose single `LOCATION` column carries the whole hierarchy by
indentation while the measures stay in their own columns.

## Problem

The banner does not merely look different from the hierarchy column. Three of
the four issues that depend on this decision are **blocked** by it, and all three
for the same reason — a row with one cell has nowhere to put a value that belongs
to a column.

_Blocked_ here means **cannot be built without this answer**, which is not the
same thing as the `blockedBy` list in an issue's §9 Planning Metadata, and the
two do not agree: #648 records `blockedBy: ['#570']` and #571 records
`blockedBy: ['#560', '#570']`, neither naming #647. Read the structural sense
below; the metadata is the scheduling graph and is maintained separately.

- **#570 (rollup subtotals).** A subtotal row exists to show aggregates _for that
  level_. A banner can print them as text but cannot align them under the columns
  they aggregate, which is the entire readability argument for a subtotal.
- **#648 (share of total and its proportional bar).** The bar is a per-measure
  cell rendering. There is no cell.
- **#651 (a group row swallows one keypress).** ADR-062's roving tab stop is
  addressed by row key **plus column key**; a row that registers no cell for any
  column key cannot receive it.

The fourth, **#571 (treegrid)**, is not blocked in that sense but is shaped by
it: `aria-level` / `aria-posinset` can be attached to a one-cell row, so tree
semantics are buildable either way — they just land differently on a row with one
cell than on a row with N.

Two constraints narrow the field before any aesthetic judgement:

- **The virtualization height invariant.** `TableBody` sizes `<tbody>` as
  `totalLoadedRows × rowHeight` and derives both spacers from the same number, so
  `offsetY + visibleRows × rowHeight + bottomSpacerHeight === totalHeight` holds
  only while every row paints at exactly `rowHeight` — see
  [`TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md).
  Any answer that makes a group row taller than a detail row is disqualified.
- **The pinned partition.** The spanning cell ignores it, covering left-pinned,
  center and right-pinned columns as one run. Anything that gives a group row
  real cells has to say which partition owns the label.

## Options considered

1. **Keep the spanning banner everywhere.** Rejected: it blocks #570, #648 and
   #651 as above, and the block is structural rather than a matter of effort.
2. **Hierarchy column everywhere, banner deleted.** Rejected: in the one
   configuration where nothing needs aligning — a single group key with no
   selected aggregates — it replaces a readable one-line summary with a label and
   a row of dashes, and it deletes a component that is already built and tested
   in order to render less.
3. **Hierarchy column, with the banner retained for exactly one configuration.
   `Chosen.`**

## Decision

**A group row renders a designated hierarchy column carrying its label, indented
by depth, and renders every other column's selected aggregate in that column's
own cell.** Group rows and detail rows share one cell grid: same columns, same
order, same count.

### The hierarchy column is synthetic and owned by the grid

It is **not** one of the consumer's `TableColumn` entries. It is injected by the
grid when grouping is active, and the user cannot hide it, move it, or unpin it.

It is not enough to mark a consumer column `isStatic`. That capability already
exists and it withholds dragging, pinning and hiding from a column that is still
one of the consumer's own — it appears in the drawer as a non-draggable item and
occupies a slot in `columns`. The hierarchy column is not a column of the data at
all; it is a rendering of the grouping configuration, which lives on a different
store (ADR-061).

**Two lists exist, and the column belongs to one of them.** It must appear in the
**rendered** partition — the `pinnedColumnPartition` that `TableBodyRows` maps
over and that `getGridColumnKeys` reads — because that partition is what the body
paints and what the focus sequence is derived from. It must **not** appear in the
**settings** list the column-order drawer offers.

Today those two lists have one source. `getEffectiveColumns` derives
`effectiveColumns` from the columns store, and `ColumnOrderSectionBody` and
`ColumnOrderSectionHeader` read that same store through `useGetColumns` and
narrow it with `filterSettingsColumns`. Keeping the column out of the drawer is
therefore **an exclusion someone has to write** — in `filterSettingsColumns`, the
one place both the draggable list and the header count agree on — and not
something that follows from injecting it. This is a requirement on #570/#571, not
a property they inherit. Anything that puts the column in the store without that
exclusion ships a drawer row for a column the user cannot act on.

### A cell with no selected aggregate renders an em dash at reduced opacity

Not blank, and not zero. The discriminating case is a genuine `sum()` of `0.00`
over a group that happens to have no discounts: a reader must be able to tell
that from a column nobody asked for an aggregate on, and from a value that has
not arrived yet. Only a dash keeps **"no aggregate"**, **"the aggregate is
zero"** and **"still loading"** as three distinct states.

Blank is already spoken for in the columns that render text. For `renderCellContent`'s
`currency`, `number`, `date` and `default` branches, a `null` or `undefined`
value becomes `''`, and `parseNumberValue` carries the comment that says why —
_"a blank cell is absent, not zero"_. (The `boolean` branch is the exception: it
renders `TableCheckDisplay`, so a null boolean paints an unchecked box rather
than nothing.) In every column that can carry an aggregate at all, therefore, an
empty cell already means _this row has no value here_ — a claim about the data.
A group row's non-aggregated cell is not that; it is a question nobody asked.
Reusing blank for both makes them indistinguishable, and an unexplained empty
cell in a grid reads as content that has not arrived. Zero collides with the
second state by stating a number that was never computed.

The dash is a rendered character in a real `role="gridcell"`, so the cell is not
**visually** blank. Whether it is also distinguishable to a screen reader is an
open question rather than a settled one: a standalone em dash may or may not be
spoken depending on the user's punctuation verbosity, nothing in this repo tests
it, and it was not verified for this decision. #570 owns giving the cell an
accessible equivalent that does not depend on the glyph being announced, and
should treat that as required work rather than a refinement. What is decided here
is only that the cell exists and is not empty.

### The hierarchy column is left-pinned, unconditionally

It is the first column of the left-pinned group, ahead of any column the consumer
pinned, and its pinning is not a state the user can change.

The alternative is not "pinned when convenient" — it is a grid where scrolling
right detaches every group row from what it is a group _of_. The aggregates stay
visible and stay recognisably aggregates, but nothing says which region or which
status they belong to, and the indentation that encodes depth leaves the viewport
with the label. A grouped grid is precisely the case where a user scrolls right
to reach measures, so that is the normal reading position, not an edge case.

### A uniform detail value never leaks onto a group row

A group row shows selected aggregates and nothing else. It does **not** fall back
to showing a column's value when every row in the group happens to share one.

The appeal is obvious — a group of orders all in `EUR` could show `EUR` in the
currency column. It is rejected on three counts. The cell's meaning would depend
on data the reader cannot see, so two identical-looking cells would mean
different things. It would flip on refresh with no visible cause: one order ships
late, the group stops being uniform, and a value becomes a dash. And it has no
server story — uniformity is not something `GROUP BY` returns, so the client
would have to fetch a group's children to know, which defeats grouping on any
table large enough to want it (ADR-059: a grouped read returns whole).

### The banner survives in exactly one configuration

**A single group key with no selected aggregates.** There, every non-label column
would be a dash, the row has nothing to align, and the existing one-line
`Key: Value (n)` summary reads better than a label followed by an empty grid. It
is already built and tested, so retaining it costs nothing to write.

That boundary is the decision. It is stated as a condition on the data — one key,
zero aggregates — so that the mix is checkable rather than a matter of taste, and
so that it cannot spread by accretion. Adding a second group key, or selecting
any aggregate, moves the table to the hierarchy column. The banner has no other
case, and it has a cost that is stated under Consequences.

### Two things that follow, rather than being decided separately

**The group's row count stays with the label.** `count(*)` over the group is a
property of the group, not of any data column, so there is no header for it to
align under; it renders beside the label in the hierarchy column, as it does
today. A per-column `count` or `count(distinct)` aggregate is a different thing —
it is selected on a column, and it aligns under that column like every other
aggregate.

**A detail row carries a hierarchy cell too, and it is empty.** The cell grid is
uniform, so the column exists on every row; a detail row's values are already in
their own columns, so it has no label to put there. The cell holds the row's
indentation and keeps the grid rectangular.

### What this hands to #570 and #571 rather than deciding

- **A genuine NULL key and a structural subtotal** are both group rows in this
  model and both render the same cell shape. The hierarchy column is therefore
  where the distinction has to live, because it is the only column whose content
  differs between them — depth and label styling are the two carriers available.
  Which of them (or both) is used is #570's, and it now has a defined place to
  put it.
- **The grand total** is a group row with an empty path: its label sits at depth
  zero in the hierarchy column and its aggregates sit in their own cells, like
  every other group row. That is the cell-shape question #647 owns; placement and
  configurability remain #578's.

## Consequences

**The virtualization height invariant is preserved, and preserved by
construction.** `TableGroupHeaderRow` composes `TableRow` precisely so `<tbody>`'s
declared height stays `totalLoadedRows × rowHeight` whether a row is a group or a
detail, and the hierarchy column changes nothing about that: it redistributes a
row's content across cells without changing the row. This is the property that
disqualified a taller, multi-line group row, and it is the reason the label must
stay on **one line**. `TableRow` pins `minHeight`/`maxHeight` alongside `height`,
so a label allowed to wrap is not a taller row — it is a silently clipped one.
The label ellipsizes, which is a visible truncation rather than an invisible
one, and deep indentation narrows the text rather than the row.

**Focus needs no special case, and #651 closes with it — in the hierarchy-column
form.** This was verified against the code rather than assumed, and the mechanism
is worth stating because the fix is an absence of work:

1. `useMoveTableGridFocus` computes the move over `data.length` — every loaded
   row, group rows included — and resolves the target column from
   `getGridColumnKeys(pinnedColumnPartition)`. No branch on the focus path reads
   `TABLE_GROUP_ROW_FIELD` or otherwise inspects a row's kind: not
   `resolveGridFocusContext`, `resolveGridFocusMove`, `commitTableFocusTarget` or
   `setTableFocusTarget`. It never asks whether the target row is a group.
   (`contexts/TableFocus/` does mention grouping twice — in
   `TableFocusContext.provider.tsx` and its `ARCHITECTURE.md` — but both are
   about which context the focus store is mounted on, per ADR-061, not about a
   row's kind.)
2. `commitTableFocusTarget` scrolls, writes `{ rowKey, columnKey, rowIndex }` to
   the focus store, and reports the key as handled, so `useTableGridFocus` calls
   `preventDefault()`.
3. DOM focus is applied by `useTableCellFocus`, which only `TableBodyCell` calls.
   `TableBodyRows` renders `TableGroupHeaderRow` **instead of** cells for a group
   row, so no node answers the outstanding request. The key is consumed and
   focus does not move — which is exactly the trace #651 records.

Give the group row one `TableBodyCell` per rendered column and step 3 is answered
by construction. No branch in the focus model changes, and #571 inherits a row
that is already a first-class focus target before it adds expansion to it.

**The retained banner keeps that hole open in its one configuration, and that is
the cost of retaining it.** A single-key group row with no aggregates still has
one cell, so #651's swallowed keypress persists there and **#651 cannot be closed
as self-closing across the board** — it must either make that one cell a
legitimate row-wide focus target or the banner has to go. The escape is cheap and
worth recording: the banner case is a strict subset of the general form, so if
the focus special case proves more expensive than the readability it buys, the
banner collapses into the hierarchy column with no other change to this decision.

**Treegrid semantics (#571) get a uniform grid to annotate.** Group and detail
rows expose the same cell count, so `aria-level`, `aria-posinset` and
`aria-setsize` land on rows that already match structurally, and `aria-expanded`
sits on a row whose cells are addressable. The gridcell count assertion in
`Table.groupedGridSemantics.test.tsx` inverts as a result: a group row will
contribute a full row of gridcells rather than none, and that test is the one
that must be updated deliberately when #570 or #571 lands the column — it is
currently the clearest executable statement of the shape being replaced.

**Pinning gets more complex, in a specific and checkable way.**
`getPinnedColumnOffsets` computes each left-pinned column's sticky `offset` as a
running sum over the left-pinned columns in effective order. A hierarchy column
injected at the head of that group **must** be present in `effectiveColumns` and
in `columnPinning.left`, or every consumer-pinned left column's offset is short
by the hierarchy column's width and the sticky columns overlap. Two smaller
knock-ons: `isLastPinnedLeft` (the shadow separator) moves to the hierarchy
column whenever the consumer pinned nothing on the left, which is the common
case; and the `leftPinned.length === 0 && rightPinned.length === 0` fast path in
that function stops firing for a grouped table, so every grouped table now walks
the pinning path.

**A column of horizontal space is spent unconditionally while grouping is on.**
On a narrow viewport the hierarchy column and the pinned partition together can
leave little room for the measures that motivated grouping. That is a real cost
of pinning it unconditionally, accepted because the alternative failure — group
rows detached from their labels — is worse and happens in the ordinary case
rather than at the margin.

**Two rendering paths exist where there was one.** The banner's narrow survival
means "how does a group row render" has two answers, and every later change to
group-row rendering has to be applied to both or deliberately not. That is the
price of the mix, and it is the reason the boundary is written as a condition on
the data rather than as a preference.

## Alternatives considered

**Rejected: repurposing the first group key's data column as the hierarchy
column.** It reads well — the label lands in the column the group is keyed by, so
no column is spent. It breaks under two things the grid already supports. Hide
that column and the hierarchy has nowhere to live; reorder it into the middle of
the table and the indentation that encodes depth appears in an arbitrary
position, or migrates as the user drags. A grid-owned column has no such
dependency on a user's column state.

**Rejected: leaving a cell with no selected aggregate blank.** Cheapest, and the
meaning is taken: `renderCellContent` already renders an absent value as an empty
cell, so blank on a group row would say "this group has no value here" — a claim
about the data — where the truth is that no aggregate was requested. It also
reads as still loading, which is the state a user is deciding whether to wait on.

**Rejected: rendering zero in a cell with no selected aggregate.** It states a
value that was never computed. Against a genuine `sum()` of `0.00` it is not
merely ambiguous, it is wrong in the direction of being believed.

**Rejected: an unpinned or right-pinned hierarchy column.** Both put the label
somewhere a horizontal scroll can remove it. See the decision above: this is the
normal state of a grouped grid, not an edge case, and a group row without its
label is an unlabelled row of numbers.

**Rejected: showing a uniform detail value on a group row.** Rejected on the
three grounds stated in the decision — invisible dependency, silent flipping on
refresh, and no server story. The last is the decisive one: `GROUP BY` does not
return uniformity, so the feature cannot exist without fetching each group's
children, which is the cost grouping exists to avoid.

**Rejected: deferring the decision to #570.** The rollup slice would have had to
choose the row shape in order to place a subtotal's values, so the decision would
have been made either way — just inside a feature PR, undocumented, and binding
on #571, #648 and #651 without any of them being consulted.

## References

- [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) — the roving tab stop this shape satisfies, and the row identity group rows are keyed by
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — grouping configuration and expansion state, the stores the hierarchy column renders
- [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — what a grouped read returns, including that it returns whole
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) — the aggregate vocabulary whose values fill the non-label cells
- [`packages/ui/src/components/Table/TableGroupHeaderRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableGroupHeaderRow/ARCHITECTURE.md) — the banner as built, and why it composes `TableRow`
- [`packages/ui/src/components/Table/TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md) — the height invariant and the `minHeight`/`maxHeight` clamp
- [`docs/agents/planning/table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) — the grouping programme this slices
- Issues #647 (this decision), #568 / #641 (the banner as shipped), #569 / #646 (multi-key grouping), #570 (rollup and subtotals), #571 (expansion and treegrid), #648 (share of total), #651 (the swallowed keypress), #560 / #645 (the focus model), #547 (parent)
