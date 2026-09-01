---
governs:
  - ui
---

# ADR-100 — The header menu refuses the layout actions a grouped column cannot take, and offers a per-column ungroup

**Status:** Accepted

**Issue:** [#1048](https://github.com/luciocabrera/lcabrera-stack/issues/1048)

**Amended by**
[ADR-105](./ADR-105-a-measure-is-a-column-of-its-own.md) — the `'measure'` half
of the pinning refusal is reversed: the three pinning items are offered on a
measure and state the band they move. The `'group-key'` half stands, as does
everything below about Hide Column and the per-column ungroup.

**Extends**
[ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the layout
derivation whose force-pin and force-show are what these two items would be
fighting.

## Context

Two items in the column header actions menu accept a click, write state, and
change nothing on screen.

**A group key.** `withGroupedColumnLayout` hoists every applied key to the head
of `columnOrder` and of `columnPinning.left` and removes it from the hidden set,
on **every** derivation. Pin Right on a group key therefore writes
`columnPinning.right`, and the next derivation puts the column back on the left;
Hide Column writes the key into `columnVisibility`, and the next derivation takes
it out. Neither is a bug in the action — both are the layout doing exactly what
ADR-080 says — but the menu was still offering them, and a control that reports
success and does nothing is worse than an absent one.

**A measure.** `useSetColumnPinning` maps a measure key through
`toDeclaredColumnKey` to the column it measures, because pinning is persisted
layout state and must stay declared-only or it accumulates keys that mean
nothing without the grouping that produced them. `withAggregateColumns` then
expands that declared key back into _every_ measure of that column. So pinning
`Sum of Total Amount` pins Minimum, Maximum and Average with it. Per-column
pinning of a subtotal is not an act the model has a place for.

Separately, there was **no way to drop one group key from the header**. The
behaviour existed — `toggleTableGroupKey` removes an applied key — but its only
entrance was a second click on the highlighted _Group by This_, an item whose
label says "apply". _Clear Grouping_ was the only visible removal, and it clears
every key and every aggregate.

## Decision

`resolveColumnLayoutLock` answers `'group-key' | 'measure' | undefined` for a
column. `PinAndHideActions` asks it once through `useTableColumnLayoutLock` and
drills the answer to its four delegates as a `layoutLock` prop, exactly as it
already drills `pinSide` — one subscription, one answer, so the four items
cannot disagree. A group key is a key in the
applied list, the same question three other surfaces already ask. A measure is a
key `toDeclaredColumnKey` resolves to something else, reusing that util rather
than parsing the token, so a declared column literally named `foo:sum` is not
mistaken for one.

Pin Left, Pin Right and Clear Pinning are disabled under either lock. Hide
Column is disabled under `'group-key'` only: hiding a measure works, and takes
its column's other measures with it, which is coherent. Each disabled item
carries the reason in a `title`, from `TABLE_COLUMN_LAYOUT_LOCK_LABELS` — an
attribute rather than a tooltip component because a disabled button fires no
pointer events, so a tooltip on one never opens. This is the same treatment
`GroupByColumnButton` already gives a refused grouping.

`RemoveGroupKeyButton` is a new delegate between _Group by This_ and _Clear
Grouping_, calling the existing `useToggleTableGroupKey`, disabled unless the
column is an applied key, and absent under a curated grouping like its two
neighbours. Its descriptor uses `EraserIcon`, this repo's settled sign for
"clear this column's X" (`CLEAR_SORTING_COMMAND`,
`CLEAR_COLUMN_AGGREGATE_COMMAND`) and distinct from the `UngroupRowsIcon` on the
whole-table _Clear Grouping_ directly beneath it.

**`Group by This` keeps toggling off.** The new item is a second, discoverable
route to the same action rather than a replacement, so no existing gesture
changes.

## Consequences

**Hide Column takes its first `isDisabled`.** It had none: the store action
silently refused a static column instead. The menu's stated invariant — every
option renders, and the ones that cannot act are disabled rather than absent —
now covers it, and `TableHeaderCell/ARCHITECTURE.md` says so.

**Two ways to remove one group key.** A user can click the highlighted _Group by
This_ or the explicit _Remove from Grouping_, and both do the same thing. That
redundancy is the cost of not changing an existing gesture; it is worth
revisiting if the toggle turns out to confuse more than it serves.

**The lock is drilled, not self-connected.** These four delegates otherwise read
what they need themselves, and the lock breaks that pattern. It follows
`pinSide`, which the shell already drills to the same three buttons, and it buys
one subscription to the columns store and the grouping keys instead of four
answers to one question. The cost is that a delegate mounted outside
`PinAndHideActions` gets no lock and would offer an action the grid refuses;
nothing mounts one today, and the shell is the only caller.

**Disabling is not diagnosing.** The measure case is refused because per-column
pinning of a subtotal is meaningless, not because the write path is broken —
the write path does what it was designed to do. If a coherent meaning for
pinning a measure is ever wanted, this is the decision to revisit, not a bug to
find.

## Alternatives considered

1. **Make the actions work instead of refusing them** — teach the layout to
   respect a group key's pinning, and give a measure its own pin entry.
   Rejected: a group key's position is what ADR-080 decided, and per-measure
   pinning would put derived keys into the persisted layout, which is the thing
   `toDeclaredColumnKey` exists to prevent.
2. **Hide the items rather than disable them.** Rejected: the menu keeps a
   stable shape so the same item sits in the same place on every column, and a
   disappearing item gives the user nothing to read. Hiding is reserved for a
   lock the user cannot act on at all, which is why `isGroupingLocked` still
   removes the grouping items outright (#578).
3. **Replace `Group by This`'s toggle with the new item.** Rejected by the
   issue's owner: it changes a working gesture and its tests to remove a
   redundancy nobody had complained about.

## References

- [#1048](https://github.com/luciocabrera/lcabrera-stack/issues/1048) — the
  report and the menu screenshots.
- [ADR-080](./ADR-080-a-group-key-renders-in-its-own-column.md) — the force-pin
  and force-show these items would be fighting.
- [ADR-011](./ADR-011-grid-interaction-architecture.md) — the command
  descriptor shape `REMOVE_GROUP_KEY_COMMAND` follows.
- `packages/ui/src/components/Table/TableHeaderCell/ARCHITECTURE.md` — the
  actions-menu section.
