# ADR-065 — A grouped grid renders its hierarchy in a grid-owned column, not a spanning banner

- **Status:** Accepted
- **Date:** 2026-08-13
- **Amended:** 2026-08-13 (#659) — the primary decision is unchanged; the rejection of the repurposed data column is restated on multi-key grouping, a grouped-by data column blanks on its detail rows, the retained banner is withdrawn, and all three are read off one principle. The body below is the record as accepted; every passage the amendment changes is marked where it stands. See [Amendments](#amendments).
- **Scope:** `@lcabrera/ui` — `src/components/Table/` group rows and the cell grid they share with detail rows
- **Issue:** #647 — constrains #570, #571, #648 and #651; amended by #659
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

> **Amended by #659.** Option 3 is withdrawn and option 2 — hierarchy column
> everywhere, banner deleted — is the decision. Its rejection above is answered
> in [Amendments](#amendments): the cost it names is real and accepted.

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

> **Withdrawn by #659.** This sub-decision is no longer in force: a single group
> key with no aggregates is a tree like every other tree, so it takes the
> hierarchy column too. The paragraphs below are the record of what was accepted
> and of the readability cost now being paid; see [Amendments](#amendments).

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

> **Withdrawn by #659**, together with the banner it describes. The escape it
> records is the one that was taken: the banner collapses into the hierarchy
> column, and #651 closes across the board rather than in all but one
> configuration.

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

> **Withdrawn by #659.** One rendering path exists, not two.

**Two rendering paths exist where there was one.** The banner's narrow survival
means "how does a group row render" has two answers, and every later change to
group-row rendering has to be applied to both or deliberately not. That is the
price of the mix, and it is the reason the boundary is written as a condition on
the data rather than as a preference.

## Alternatives considered

> **Superseded by #659.** The rejection stands; the reason recorded here does
> not carry it. Hiding and reordering are both already withheld by `isStatic`,
> so this paragraph is answerable as written — the argument that survives is
> multi-key grouping, and it is in [Amendments](#amendments).

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

## Amendments

**2026-08-13 — the result-shape principle, and the three things it settles
(#659).** The primary decision is unchanged: a grid-owned hierarchy column, with
every other column's aggregate in its own cell. What changes is the argument
under it. The rejection of the repurposed data column was rested on column hide
and reorder, and that argument does not survive contact with the code — so it is
restated on the ground that does. Two further points follow from stating the
principle the decision was actually made on, and one of them withdraws a
sub-decision.

### The principle

**The rendering follows the shape of the result set, and the grouping mode
determines that shape.** It is not a per-configuration judgement about what reads
more nicely.

`GroupingMode` in
`packages/server/src/db/group-query-builder/group-query-builder.types.ts` has two
members today, `flat` and `rollup`, and `expandGroupingSets` builds both by
dropping keys from the tail of the key list — so every grouping set either mode
emits is a **prefix** of it. Prefixes form a chain, so a row's ancestors are the
prefixes of its own key list and it has **at most one** parent — one for every
row but the grand total, which is rollup's empty prefix and has none. Depth is
therefore a property the row carries. That is a **tree**, and a tree
renders as the hierarchy column: indentation is a faithful encoding of depth
because depth exists.

`cube` (#574) is deliberately absent from that union, for the same structural
reason: it emits every subset of the keys, so it returns rows like
`(all countries, Electronics)` — under the grand total, but under no country. Its
sets are not
prefixes, which is why the comment on `expandGroupingSets` records that adding it
needs a real expansion rather than an entry in the count map, and why
[`table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md)
notes that a row's grouped-key count equals tree depth **only** under rollup.
A row whose ancestors are not a single chain has no one place to sit, so there is
no depth for indentation to encode. That is
a **lattice**, and a lattice renders flat: each group key keeps its own column
and the filled cells are coordinates rather than a level. When cube lands, that
is the shape it takes, and it is a different rendering because it is a different
result set — not a second opinion about the same one.

### 1 — Why the repurposed data column is rejected, restated

The rejection recorded above leans on hide and reorder, and `isStatic` on
`TableColumn` already withholds both — a shipped capability, not a proposal.
`resolveColumnCapabilities` resolves the flag;
`useToggleColumnVisibility` returns early for a static column;
`TableHeaderActionsMenu` computes `hasPinAndHide = !isStatic`, so a static
column's header menu offers neither hide nor pin; `createDraggableItems` marks
the drawer row `isDraggable: !isStatic`, and `DraggableListItem` wires the drag
handlers only while dragging is enabled, so a static row is neither a drag source
nor a drop target. **`isStatic` was considered for this and is not the missing
piece** — the rejection does not need it.

The argument that carries the rejection is multi-key grouping.
`MAX_TABLE_GROUP_KEYS` (`@lcabrera/ui`) and `MAX_GROUP_KEYS` (`@lcabrera/server`)
are pinned to each other by
`apps/react-router/src/routes/enterprise-orders/.server/groupingContract.test.ts`,
and `Table.constants.test.ts` asserts the UI cap admits more than one key, so a
group's identity is a tuple by contract and not by today's configuration:
`TableGroupRowSummary.path` is the key values **in key order**. Repurposing has
two readings and neither survives it.

**Reading A — only the first group key's column is the hierarchy column.** A
group at depth _n_ carries _n_ path entries and this reading offers one cell for
them, so levels two and below have nowhere to render. A second group key is
enough to break it. Nothing has to be hidden and nothing has to be reordered,
which is why the original rejection could be answered without touching the
conclusion.

**Reading B — each grouped column carries its own level.** The staircase: the
level-1 key's value sits in the level-1 key's column, the level-2 key's in its
own, and depth is read from which column is filled. This **works**, and the data
already supports it — `TableGroupKeyValue` carries `columnKey` beside `label`, so
every level names the column it belongs in. It is the flat rollup-report form,
and by the principle above it is the right rendering for a lattice.

It fails for **this** grid, for a reason that is about arrangement rather than
about capability. A staircase reads only while the group-key columns appear in
key order with nothing between them, because "which column is filled" is the
entire depth signal — an ungrouped column sitting between two of them is read as
a rung. Grouping establishes neither property, and the layout controls the grid
already has work against both:

- **Column order and grouping are independent state, persisted through different
  channels.** Column order, pinning and visibility are per-browser layout,
  written to the cookie by `usePersistTableStateAction` and seeded back by the
  loader; the grouping configuration is in the URL (ADR-061). Group by `Country`
  then `Status` in a table whose columns run Name, Status, Amount, Country and
  level 2 sits to the left of level 1 with an unrelated column between them —
  before anyone drags anything.
- **`isStatic` freezes an arrangement; it cannot create one.**
  `restoreStaticColumnOrder` re-inserts every static key at its **index** in the
  current order and lets the rest fill in around them, so marking the group-key
  columns static pins them to exactly the positions they already occupy — gaps
  and inversions included — and the number of columns standing between two of
  them is then invariant under every drag. The user can change which column sits
  in the gap but cannot close it by reordering. Closing it means taking the
  intervening column out of the rendered run some other way, and there are two:
  hide it, or pin it — `getEffectiveColumns` drops hidden columns and then
  re-partitions the rest into left-pinned → centre → right-pinned, so either
  route lifts it out from between the two group keys. Both make the hierarchy's
  legibility depend on visibility or pinning state that has nothing to do with
  the query.
- **Pinning cuts the other way too.** One group-key column pinned left while its
  sibling sits in the centre puts two rungs of the ladder either side of the
  horizontal scroll region, and `isStatic` locks that in rather than resolving
  it. So the same partition that can close a gap can also open one that no
  reordering reaches.

Making the staircase safe therefore means the grid **imposing** the arrangement —
moving the group-key columns to the front in key order when grouping is applied,
and forbidding every other column from crossing them for as long as it is on.
That is two costs, not one. It rewrites cookie-persisted layout the user chose,
as a side effect of a query change. And it makes column order into query
structure: if position carries the level, a drag is a re-key, so a presentation
gesture rewrites the `GROUP BY` — and since order is per-browser while grouping
travels in the link, two people opening the same grouped URL would be reading
different hierarchies. A grid-owned column has neither problem, because its
position is not the user's to hold an opinion about.

### 2 — A grouped-by data column renders blank on its detail rows

**New sub-decision.** Group by `Status` and every detail row inside a group
carries the same value under a header that already says it — a column of one
word, repeated. The value is stated once, by the group row that owns it, and
which group a detail row belongs to is what the indentation above it already
says. So a data column that is currently a group key renders **blank** on detail
rows.

On a **group** row that column follows the general rule unchanged: the selected
aggregate if one was chosen on it, the em dash if not. Filling it with the key's
own value instead is reading B, rejected above.

Two constraints hold it in place, and the second carries an open condition with
it.

**The column stays visible, with its header.** Ungrouping is one interaction
away, and this is not a hidden column — the user did not ask for it to go, and
the grid must not spend the user's visibility state to say something about the
query. It is also where the column's own controls live: `getEffectiveColumns`
drops a hidden column before the header renders, and `ManageColumnAction` — the
only opener of the per-column `ColumnSettingsDrawer`, whose Filter tab is where
that column's filter is edited — sits inside the header actions menu. Hiding the
column would take that with it. (The settings drawer's add-filter picker offers
every filterable column regardless of visibility, so filtering would not be lost
outright; the column's own header-anchored route to it would be.)

**Blank here is kept apart from the two blanks the grid already has, and it is
worth being exact about how, because only one of the two separations is free.**

Against the **em dash** the separation is structural: the dash is a group-row
state meaning _no aggregate was requested_ and it paints a glyph, while this is a
detail-row state that paints nothing. They cannot occur in the same cell of the
same row, and they do not look alike.

Against `renderCellContent`'s empty string the separation is a **partition by
column**, and it is a real reassignment of meaning rather than an agreement
between two readings. In an **ungrouped** column, blank keeps exactly the meaning
it has today — _this row has no value here_, a claim about the data, the reading
`parseNumberValue`'s comment protects. In a **grouped** column it means _my group
row states this value_. The two do not reconcile: a detail row inside a
`Status = Shipped` group **has** a value, so the old reading is simply false
there. What keeps them apart is that exactly one of them is in force for a given
column, and the grouping configuration is what says which. (They happen to
coincide in the NULL-key group, where both are true at once. That is a
convenience, not the mechanism, and it should not be mistaken for one.)

**A partition only reads if the reader can see which side of it a column is on,
and today the grid barely says.** A grouped column is marked nowhere on the
header face; the only in-grid signal is inside that column's own actions menu,
where `GroupByColumnButton` renders itself as applied. Sub-decision 3 below then
removes the banner, which was the one place the key's column name was stated
inline. **These are one question, not two.** Whatever #570 does with the
hierarchy column's header to carry the context the banner used to state — naming
the group keys, in key order, is the obvious form — is also what tells a reader
which data columns are blanked by this rule. If that lands, the partition is
legible. If it does not, this sub-decision ships an unlabelled empty column, and
it should be revisited rather than shipped that way; **that is a condition on
#570, not a refinement.**

What this hands to #570/#571 rather than deciding: the detail path has no reason
to read the grouping configuration today — `TableBodyRows` asks the **row** which
component it gets, not the configuration — so this is the first rule on that path
that needs to know a **column** is a group key. `useGetTableGroupingKeys` is the
selector, and the store it reads is one the body cells are already inside; the
requirement is that the cell consult it, in the same way that keeping the
hierarchy column out of the drawer is a `filterSettingsColumns` exclusion someone
has to write.

### 3 — The banner is dropped

**The retained banner is withdrawn. There is one rendering path for a group
row.** A single group key with no selected aggregates is a `flat` result with one
key: a tree, like every other tree, so by the principle it takes the hierarchy
column. The carve-out rested on that configuration reading more nicely, which is
exactly the case-by-case reasoning the principle exists to remove — and a
boundary that has to be re-argued per configuration is one that spreads.

What follows:

- **One rendering path, not two.** Every later change to group-row rendering is
  made once, rather than being applied to both paths or deliberately not. The
  Consequences note about two paths is withdrawn, and with it the reason the
  boundary had to be written as a condition on the data — there is no boundary
  left to hold.
- **One fewer focus special case, and #651 closes outright.** The Consequences
  section above establishes that the swallowed keypress is answered by giving a
  group row real cells, and that the retained banner would have kept the hole
  open in its one configuration. With no banner there is no exception: every
  group row is a row of `TableBodyCell`s and the roving tab stop needs no branch.
  #651 is self-closing across the board rather than "except in one
  configuration", and the sentence that said otherwise goes with the banner.
- **The gridcell-count assertion inverts everywhere.**
  `Table.groupedGridSemantics.test.tsx` pins groups at contributing no gridcells;
  it now becomes a full row of them for **every** grouped table, with no
  configuration excluded.
- **The cost, plainly.** In that one configuration the user now gets a label, a
  count and a row of dashes where a one-line `Key: Value (n)` summary would have
  been. That is less pleasant to read, and it is accepted for one shape instead
  of two. Note what the banner carried that the row no longer does: its segments
  are `<column label>: <value>` per key (`toGroupHeaderSegments`), so the key's
  column name was stated inline. Where that context now lives — the hierarchy
  column's own header is the obvious candidate — is #570's to answer, and it is
  a real question this amendment creates rather than one it settles. **It is the
  same question sub-decision 2 hands to #570**: the header that names the group
  keys is also what tells a reader which data columns are blanked, so answering
  it once answers both, and leaving it unanswered costs both.
- **A built, tested component is deleted to render less.** That was option 2's
  stated cost when it was rejected, and it is still true. It is accepted:
  `TableGroupHeaderRow` has no surviving configuration to render, so keeping it
  would mean keeping a second path alive for nothing.

### A note on reading this record

**The code paths named above are not machine-checked, and an ADR is where that
matters most.** `docs:verify` treats a dated record differently on purpose:
`enforcedTokens` in `scripts/lib/docs-paths.mjs` drops root-anchored path
_tokens_ for anything under `decisions/`, because an ADR naming a path is
recording what existed when the decision was made and that stays true after the
file moves. Confirmed here by probe rather than by reading: breaking a backticked
`packages/server/…` citation in this section leaves the gate at exit 0, and so
does breaking a relative link to a `.ts` file (`extractCandidates` keeps a link
only when it is root-anchored or ends in `.md`); breaking the relative `.md` link
above fails it. So the links between documents are gated and the citations into
the code are not.

Every claim this amendment makes about the code was therefore checked by hand
against the tree at the time of writing, and a later reader has to do the same
rather than infer from a green pipeline that the citations still hold. That is
the failure mode this ADR already has history with — its first round shipped
claims nothing had checked.

## References

- [ADR-062](./ADR-062-grid-semantics-roving-focus-and-row-identity.md) — the roving tab stop this shape satisfies, and the row identity group rows are keyed by
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — grouping configuration and expansion state, the stores the hierarchy column renders
- [ADR-059](./ADR-059-aggregation-is-builder-generated.md) — what a grouped read returns, including that it returns whole
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md) — the aggregate vocabulary whose values fill the non-label cells
- [`packages/ui/src/components/Table/TableGroupHeaderRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableGroupHeaderRow/ARCHITECTURE.md) — the banner as built, and why it composes `TableRow`
- [`packages/ui/src/components/Table/TableRow/ARCHITECTURE.md`](../../packages/ui/src/components/Table/TableRow/ARCHITECTURE.md) — the height invariant and the `minHeight`/`maxHeight` clamp
- [`docs/agents/planning/table-row-grouping-plan.md`](../agents/planning/table-row-grouping-plan.md) — the grouping programme this slices
- [`packages/server/src/db/group-query-builder/expand-grouping-sets.util.ts`](../../packages/server/src/db/group-query-builder/expand-grouping-sets.util.ts) — the grouping sets each mode emits, and why cube is not one of them
- Issues #647 (this decision), #659 (the amendment), #568 / #641 (the banner as shipped), #569 / #646 (multi-key grouping), #570 (rollup and subtotals), #571 (expansion and treegrid), #574 (cube), #648 (share of total), #651 (the swallowed keypress), #560 / #645 (the focus model), #547 (parent)
