---
governs:
  - ui
---

# ADR-097 — A fold control folds the groups its own column states

**Status:** Accepted

**Date:** 2026-08-30

**Issue:** [#1041](https://github.com/luciocabrera/lcabrera-stack/issues/1041)

**Narrows:** [ADR-083](./ADR-083-a-fold-must-leave-a-row-to-undo-it.md) — which
groups may be folded is unchanged; this says which control folds which of them

## Context

Three controls sit in a group-key column and fold a group: the chevron drawn in
the cell, the expansion keys on a focused cell, and the "Collapse This Level"
and "Expand This Level" pair in the column's header menu.

Two of them already answered the same way. `resolveGroupLevelDisclosures` walks
a row's group path and emits, for the entry at index `i`, a disclosure carrying
that entry's `columnKey` and the path prefix `slice(0, i + 1)` — so the chevron
drawn in a key column folds the group that column names.
`resolveFocusedGroupFold` looks the same disclosure up by column, so the
keyboard folds what the chevron in that cell folds. ADR-080's #802 amendment put
the control on every row that states a level rather than on the subtotal that
ends the block, and ADR-083 then fixed which levels may carry one at all.

The level pair, shipped in #1020, was built to a product note that read the
other way: fold the level **above** the open column, on the reasoning that this
is what takes the column's own values off the screen.
`collectGroupLevelFoldPaths` implemented it as `groupingKeys.indexOf(columnKey)`
followed by `summary.path.slice(0, depth)`.

## Problem

Both readings reach the same set of end states. They differ by one column: which
menu you open to reach a given fold, and which end of the grouping is inert. The
cost is that a reader who folds a group with the chevron and then reaches for
the menu item in the same column gets a different level, with nothing on screen
saying why.

Two things follow from the off-by-one. On the innermost key the pair was live
and folding it removed that column's own rows — the column acted on is the one
that disappears. On the outermost key the pair was withheld, and the reason was
arithmetic rather than structure: `slice(0, 0)` yields the root path key, which
no row renders, so it never enters `foldableGroupPaths`.

## Decision

**A control in column X folds the groups X states.** The level command is "do to
every group at this level what the chevron does to one", and it is derived from
the chevrons rather than computed beside them: `collectGroupLevelFoldPaths`
takes the tree's row metadata and unions the level disclosures whose `columnKey`
is X. There is one derivation of which groups a column's controls fold, so the
menu and the chevrons cannot disagree by arithmetic.

The util no longer takes `data`, `groupingKeys` or `foldableGroupPaths`. The
foldable set still governs, through the disclosures, which are already filtered
by it — a leaf group owns no rows and never enters it, so the innermost key
answers the empty set without being named as a case.

`useTableGroupLevelFold` asks two questions rather than one:

- **Offered at all** is whether the column is an applied group key. A column
  that is none is withheld, for the reason the aggregation block is withheld:
  no click in this menu can make a column a group key.
- **Enabled** is whether that column's groups have anything left to fold or
  unfold. The innermost key is inert, and so is every key column under `flat`,
  where ADR-083 already leaves the whole-table pair disabled.

The split matters because the second is a state the reader can clear: apply a
deeper key and the innermost key's groups own rows, so the pair comes alive.
Withholding it there would have said the opposite.

## Consequences

- The menu items now act one column further in than they did. Anyone who
  learned #1020's behaviour has to relearn it, and no migration is possible —
  expansion is client state (ADR-061), so nothing persisted encodes the old
  reading.
- The pair appears on the innermost group key, disabled. That is one more inert
  control in the menu than before, which is the price of saying "this level has
  nothing under it" rather than saying nothing.
- The level set is now read off the **visible** rows, because that is what the
  chevrons are drawn from. With an ancestor folded, a deeper column's pair goes
  inert: none of its groups is on screen. The previous derivation walked every
  loaded row and would have folded groups the reader could not see.
- Epic #1017's product note is corrected, not implemented. The repository owner
  compared both readings against a live grid and chose this one; the note was
  the mistaken half, and #1020 built to it faithfully.
- ADR-083 survives unchanged, and it had to be re-checked rather than assumed:
  under this reading the outermost key becomes foldable from its own menu, which
  is exactly the case ADR-083 exists to police. It holds because a collapse asks
  whether a **proper** prefix of a row's path is folded, so a group's own row is
  never hidden by its own fold. Folding the outermost level from its column
  leaves the top-level rows on screen, each carrying a live chevron.
  `Table.groupLevelFold.test.tsx` drives that round trip.

## Alternatives considered

**Keep the level rule and change the chevron to match it.** Rejected: the
chevron cannot fold the level above the column it sits in without the control in
one cell acting on a group named in another, and ADR-080 put the control in the
cell that states the level precisely so the two coincide.

**Fix the arithmetic in place** — `slice(0, depth + 1)` instead of
`slice(0, depth)` — and keep the `indexOf` guard. Rejected: it reaches the same
sets today and leaves two functions computing them separately, which is the
drift the command layer exists to prevent. The guard existed only because
`indexOf`'s `-1` would otherwise have meant "every entry but the last".

**Withhold the pair on the innermost key**, as #1020 did for the outermost.
Rejected on the state test above: a withheld control says the question does not
apply, and here it does.

## References

- [#1041](https://github.com/luciocabrera/lcabrera-stack/issues/1041) — the
  defect, with the three controls compared side by side
- [#1020](https://github.com/luciocabrera/lcabrera-stack/issues/1020) — shipped
  the level pair to the superseded reading
- [ADR-083](./ADR-083-a-fold-must-leave-a-row-to-undo-it.md) — which groups may
  be folded at all
- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the fold model
  and its #802 amendment, which put the control in the cell that states the level
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — expansion
  is client state, so no fold is persisted
