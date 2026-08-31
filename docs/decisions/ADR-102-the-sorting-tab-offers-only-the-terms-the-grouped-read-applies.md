---
governs:
  - ui
---

# ADR-102 — The Sorting tab offers only the terms the grouped read applies

**Status:** Accepted

**Issue:** [#1050](https://github.com/luciocabrera/lcabrera-stack/issues/1050)

## Context

`toGroupSort` builds a grouped read's `ORDER BY` from two things and nothing
else: one term per group key, and one term per sort naming a staged measure's
`column:fn` token. Every other entry in the table's `sorting` is dropped, with
no error and no trace — and `assertGroupSort` would refuse it downstream if it
were not dropped first, because within one grouping set the key columns already
identify the row, so a sort on any other column orders nothing.

The Sorting tab did not know this. `AddSortSection` offered every sortable
declared column, and `ActiveSortList` listed every entry in `sorting`. Grouped
by two keys, a grid whose route declares thirty columns offered twenty-eight
sorts that could not run, and `Sort by Column Order` staged all of them at once
— which is how the tab came to show fourteen rows that ordered nothing.

Note which side of the token boundary a measured column sits on. Grouping by
`region` and summing `total_amount` puts `total_amount:sum` in the read and
leaves bare `total_amount` out of it, so the source column is no more sortable
than one nobody measured.

## Decision

**A pure `resolveGroupedSortScope`** answers with the keys the read applies —
declared group keys (`resolveDeclaredGroupingKeys`, so a URL naming a column
this route does not declare is discounted) plus the staged measure tokens — or
with `undefined` when no declared key is grouped, which leaves an ungrouped grid
exactly as it was.

**One hook, `useGroupedSortScope`, resolves it against the drawer's staged
grouping** and hands both Sorting-tab surfaces the same predicate. Staged, not
applied: the tab reflects the edit in progress, so removing the last group key
brings the column sorts back before Accept, not after.

**The state is filtered for display, never rewritten.** An out-of-scope sort
stays in `sorting`, so clearing the grouping restores it. `ActiveSortList`
re-appends the hidden entries after a drag so a reorder cannot quietly delete
them.

## Consequences

**Sorts survive a grouping round-trip.** Sort by Email, group, ungroup: the
Email sort is where you left it. The alternative — pruning on group — would have
made grouping destructive to a setting it has no business owning.

**`sorting` can hold entries no surface shows.** The Clear Sorting button still
clears them, and they still travel in the URL, so a shared link carries a sort
its recipient cannot see until they ungroup. That is the price of not rewriting
state, and it is the same trade the grid already makes: `withGroupedColumnScope`
narrows what is painted while `columnOrder` keeps every column.

**`Sort by Column Order` still stages every sortable column.** Grouped, the tab
then shows only the group keys among them. Narrowing what that button writes is
a separate question about what the button means, not about what the tab shows.

## Alternatives considered

1. **Drop out-of-scope sorts from state when a grouping is applied.** Rejected:
   it would make a derivation write state, which is exactly what ADR-096 rules
   out for the column scope, and it would lose a setting the user never asked to
   discard.
2. **List them disabled, with a reason.** Rejected: the tab's own count is its
   headline, and a list where most rows are struck through says the grid is
   doing something it is not. The refusal is not about this column — it is about
   the shape of a grouped query — so it has no per-row explanation to give.
3. **Ask the applied grouping rather than the staged one.** Rejected: every
   other control in the drawer reads the draft, and reading the applied state
   here would leave the tab a step behind its own Grouping tab.

## References

- [#1050](https://github.com/luciocabrera/lcabrera-stack/issues/1050)
- [ADR-096](./ADR-096-the-grouping-decides-which-columns-the-grid-shows.md) —
  the same rule for the grid's columns: the grouping narrows what is shown and
  writes nothing, which is what makes clearing it free.
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — why the token format
  this scope depends on is spelled twice.
