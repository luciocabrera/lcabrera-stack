---
governs:
  - ui
---

# ADR-096 — The grouping decides which columns the grid shows, and the settings drawer reads the same derivation

**Status:** Accepted

**Issue:** [#1019](https://github.com/luciocabrera/lcabrera-stack/issues/1019)

**Supersedes part of**
[ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) — the em dash an
unmeasured column drew on a group row.

**Extends**
[ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the grouped
layout derivation, with removal and with what the settings drawer reads.

## Context

While a grouping is applied, two derivations reshape the `Table`'s column list.
`withAggregateColumns` replaces each measured column with one column per
aggregate; `withGroupedColumnLayout` hoists the group keys to the head of the
order and of the left pin and forces them visible. Both are derivations and
never state, which is what makes clearing the grouping free.

Nothing removed a column. A grid grouped by three keys with five measures
therefore painted eight columns that carry something and every other declared
column beside them, each one drawing the em dash ADR-065 defined for a column
carrying no aggregate. That em dash was right while the grid also held a
group's own rows underneath it: the column was empty on the group row and full
on the detail rows below.
[ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md) ended that — a group
opens its rows in a route that applies no grouping — so a grouped grid holds
group rows and nothing else, and a column carrying no aggregate now serves no
row at all.

The settings drawer's Columns tab answered a different question again. It built
its rows from the **declared** columns and ticked each one from its own working
copy of `columnVisibility`, so it listed every column as shown, in declared
order, while the grid painted a derived set in grouping order. Two lists, two
answers, one table.

One column survived its own measure for a third reason. `withAggregateColumns`
kept a **primary-key** column beside its measures rather than replacing them,
on the belief that `resolveCrudRowId` would otherwise find no column carrying
`isPrimaryKey` and strip the row-actions menu from every row. That belief was
wrong: a row id is resolved from the columns store's `columns` — the consumer's
declared list — which no derivation writes to. The kept column bought nothing
and painted a column of em dashes under a band labelled with the source
column's name.

## Decision

**A third derivation step, `withGroupedColumnScope`, runs between the two.**
While a grouping names at least one declared key, the painted column list is
the declared group keys, the measure column of each applied aggregate, and the
row-actions column — and nothing else. It filters `columns`; the order, the
pinning and the visibility it receives pass through untouched, because the
scope decides which columns exist and the layout decides where they sit.

**The row-actions column is kept, and it is the one exception.** It is not a
data column: its cell is the grid's own affordance rather than a field of the
row, so "the grouping does not name it" is not a statement about it. Every
other column the grouping neither keys nor measures is dropped.

**A measured column is replaced, primary key included.** A row id is resolved
from the declared columns, so the derived list is free to leave the source
column out. `resolveCrudRowId` keeps answering exactly where it did before.

**The Columns tab reads the same derivation.** `resolveRenderedColumnKeys` runs
`getPinnedDerivedColumnsState` over the drawer's own draft and maps each painted
key back to the column it was derived from, so a measure ticks its source's row.
That answer drives three things: `Show` is on for a column the grid paints,
the painted columns are listed first in the order the grid paints them —
**while a grouping is applied, and only then**, because hoisting an ungrouped
list would sink every hidden column to the bottom and a drag would persist that
as the consumer's own order — and the count in the section header is the size of
that set. Nothing is removed from the
list — a column the grouping does not name is still listed, unticked, which is
what makes it addressable.

**The drawer reads its own draft, the grid reads the applied grouping.** The
Columns tab already holds a working copy of order, pinning and visibility, so
deriving its ticks from the applied grouping would mix a draft against live
state — the same disagreement this decision removes. Both run one derivation
over their own inputs, and the two agree exactly when the draft is the applied
state: on open, and after Accept.

**"A grouping is applied" means the same thing on both sides.** The scope and
the hoist both resolve the applied keys against the declared columns first
(`resolveDeclaredGroupingKeys`), because grouping is URL state and can name a
column this route never declared — a link shared from a route with a different
column set, or a hand-edited param. Every drawer answer that turns on whether a
grouping is in effect resolves the same way: the question the `Show` toggle
asks, the order the tab lists its rows in, and the refusal to drag. So a
grouping naming only undeclared keys leaves the tab exactly as an ungrouped one
leaves it — the grid is painting every column, and the drawer says so. Deciding
it on the raw key list instead left a hidden column un-showable: ticking it was
answered with a prompt that writes only the grouping, while the grid it was
meant to rejoin was never scoped at all.

**The key cap is the one count that stays on the applied keys.**
`MAX_TABLE_GROUP_KEYS` is a fact about the grouping that would be written, and an
undeclared key occupies a slot in it, so `resolveColumnGroupingChoices` counts
the list as it stands rather than the declared subset of it.

**The Filters tab reads the declared columns, not the painted ones.** Which
columns the grid paints is a statement about the grid; whether a column can be
filtered is a statement about the column, and the consumer's declaration is
where that lives. So every surface answering a filter question — the guard that
decides whether an active filter is listed, the label its row draws, the inputs
it renders, and the column the Add button resolves — reads
`useGetDeclaredColumn` rather than the painted `normalizedColumns`. Taking them
from the painted list instead has two reachable ends, both while a grouping is
applied and both on a column it neither keys nor measures: an existing filter
vanishes from the list while it stays on the query, so the only control that
would remove it is gone until the grouping clears; and the picker keeps offering
the column while the Add button resolves nothing and silently does nothing. The
picker and the add path now read one list, so an offer that cannot be honoured
is not expressible.

**Turning a column on is a request to join the grouping — unless the grouping
already names it.** The question the toggle asks is whether the grouping
**names** the column (`isColumnNamedByGrouping`: it is a group key, or it
carries an applied aggregate), never whether the column is currently
**painted**. The two differ for a measured column the user has hidden: hiding
the source hides its measures with it, so it is named and not painted, and
asking the painted question would route a request to un-hide it into a prompt
that only ever writes the grouping — leaving it invisible however many
aggregates were added, with clearing the grouping the only way out.

So a named column takes the ordinary path and the tick un-hides it. An unnamed
one opens a prompt offering what that column supports — as a group key, or with
one of its offerable aggregates — resolved by `resolveGroupKeyAvailability` and
`resolveAddableAggregates`, the same pair the Grouping tab's own pickers read
([ADR-058](./ADR-058-grouping-legality-by-analytical-role.md),
[ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md)).
Accepting a choice writes the grouping draft **and** takes the column off the
hidden set, because the gesture was "show this" and the grouping alone cannot
show a hidden column. Unticking is unchanged: it writes `columnVisibility` as it
always did.

**A refusal names its cause.** An empty choice list has four of them, and only
one is a statement about the column's capabilities, so
`resolveColumnGroupingChoices` returns a `refusal` alongside the options rather
than leaving the caller to guess: the column is already a key; the grouping is
at `MAX_TABLE_GROUP_KEYS` and the column has no aggregate left to add; the
`countDistinct` budget or the column's own applied functions leave the picker
nothing (`resolveAddableAggregates`' existing `gap`); or the catalogue offers it
neither role. The cap outranks the two aggregate gaps, because it is a fact
about the grouping's shape and points at the control that would actually clear
it. Saying "this column can be neither" for any of the first three would be
false.

**No row in the Columns tab is draggable while grouping is applied.** ADR-080
made a group key undraggable because the next derivation would undo the drag.
The order the tab now shows is derived for its whole length, so a drag would
write a derivation into the persisted column order — the one thing the whole
grouped layout is built to avoid. The refusal extends to the whole list for
that reason and lifts the moment the grouping clears.

## Consequences

**What it buys.** The grid paints only columns that carry something. The Columns
tab and the grid agree by construction rather than by two implementations being
kept in step. A measured primary key gets a band spanning its measures alone.
And a column that is not in the grouping now has a way in that says what the
grouping can do with it, instead of a toggle that appears to work and changes
nothing on screen.

**What it costs.** A detail row arriving in a grouped grid now renders entirely
blank: its group-key cells are blanked because the group row above states the
value, and the measure columns are fields it does not carry. That is the
completion of the limitation ADR-065 already carried, and it is only reachable
by feeding a grouped grid rows a grouped read does not return — ADR-087 moved a
group's own rows to a route that applies no grouping. Keeping the unmeasured
columns to serve such a row is the trade this decision refuses: they can carry
no aggregate, so each would draw the em dash on every group row of every grouped
view.

**No cell of a grouped grid can hold a consumer's own `render()` output.** A
group-key cell is the grid's own, and a measure column is built from its source
without carrying `render`, so a column declaring one is either a key, a measure,
or not painted. Anything that has to be checked about consumer-rendered content
— its alignment, for one — is only checkable on an ungrouped grid.

Pinning and hiding a column the grouping does not name still write the
consumer's own layout, and neither shows on screen until the grouping clears.
That is deliberate: the layout is the consumer's and the grouping is a lens over
it, so an edit made under the lens is kept rather than refused. **A filter is
not layout** — it restates the read, so it takes effect under the lens rather
than waiting for it to clear, which is why the Filters tab stays addressable for
every declared column and not only for the painted ones.

**The trap.** The removal has to stay a derivation. `columnVisibility` is
persisted and the drawer writes **declared** keys into it, so a derived key that
reaches the cookie can never be taken out again through the per-column UI —
which is why the prompt writes the grouping and never the visibility set, and
why the scope step writes no state of its own.

## Alternatives considered

1. **Keep every declared column and stop drawing the em dash.** Rejected: the
   column is still painted, still takes width, still appears in the header
   sequence a screen reader counts through, and still answers "no" to the
   question its header asks. Blanking it hides the symptom.
2. **Filter the non-participating columns out of the Columns tab as well.**
   Rejected for the reason ADR-080 gives for listing a group key: the tab is
   where a user asks what the grouping is holding, and a column that is not
   listed cannot be asked for. Listing it unticked is what makes the prompt
   reachable.
3. **Have the Columns tab read the applied grouping rather than the draft.**
   Rejected: the tab's other rows are a draft, so the ticks would answer for a
   different state than the order and pinning beside them — and a choice made in
   the prompt would change nothing visible until Accept.
4. **Write the grouping-derived order into `columnOrder` and let the drag
   stand.** Rejected: that is state, and clearing the grouping would then have
   to undo it. Refusing the drag while grouped costs a gesture in one
   configuration and keeps ungrouping free.
5. **Decide the prompt on whether the column is painted, and have the accept
   path clear the hidden key.** Rejected: it fixes the invisibility and leaves
   the wrong question in place, so ticking `Show` on a hidden, already-measured
   column would still open a prompt asking which _second_ aggregate to add.
   The naming test is the one the gesture is actually about.
6. **Keep the primary-key column beside its measure.** Rejected on evidence:
   `TableRowActionsMenu` and `resolveRowKey` both read the columns store's
   declared `columns`, which no derivation writes, so nothing depended on the
   painted list carrying `isPrimaryKey`.

## References

- [#1019](https://github.com/luciocabrera/lcabrera-stack/issues/1019)
- [ADR-065](./ADR-065-grouped-rows-render-a-hierarchy-column.md) — the em dash
  for a column carrying no aggregate
- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the grouped
  layout derivation this extends
- [ADR-087](./ADR-087-a-group-opens-its-rows-in-a-route.md) — a group's rows
  open in a route, which is what leaves a grouped grid holding group rows alone
- [ADR-058](./ADR-058-grouping-legality-by-analytical-role.md),
  [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) — the
  per-column legality the prompt reads and does not decide
- [ADR-095](./ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md)
  — why the reasoning above is here rather than beside the code it governs
- [`packages/ui/src/components/Table/ARCHITECTURE.md`](../../packages/ui/src/components/Table/ARCHITECTURE.md)
  — the Layout section
