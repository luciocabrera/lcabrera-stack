---
'@lcabrera/ui': minor
---

Fix the grouped Table's share bar and the function picker, keep a column's
aggregates together, and settle the grouping menu.

**The share bar never filled.** `TableGroupShare`'s track sits in an
`inline-flex` container, so it is blockified as a flex item and draws — but it
set no `display` of its own, leaving the fill span inline, and `width` and
`height` do not apply to an inline non-replaced box. The percentage read
correctly beside a bar that was empty at every ratio. Both track and fill now
declare `display: block`. Note for anyone reading the old comment there: it
claimed the dynamic style keeps the value out of a `style` attribute for CSP
reasons. It does not — StyleX emits `style="--x-width: 10%"` — and the comment
is gone.

**The "Select a function…" picker shimmered permanently.** `VirtualSelect` had
no disabled state, so the caller reached for `isBusy`, which is what draws the
loading overlay. It now takes **`isDisabled`**: inert exactly as busy is, with
no shimmer.

**A column's aggregates stay contiguous.** `DraggableItem` takes an optional
`groupId`, and `DraggableList` refuses a drop that leaves **more** groups split
than it found (`countFragmentedGroups`) — other consumers pass none and are
unaffected. Compared rather than judged outright, because an interleaved list
arrives without anyone crafting one: a `grouping` link written before this
release carries an interleaved `agg`, and refusing every imperfect result would
leave a sufficiently fragmented list with no drop it would accept at all. `addTableColumnAggregate` also stops
appending to the tail, which could build an interleaved list with no drag at
all. The grid already clamped this at paint time; the drawer can no longer
express the state it clamped.

**Menu.** A separator between the grouping items and the fold items, and
`Remove from Grouping` is now **`Remove This Group`**, carrying the same icon as
the remove button on the draggable rows. **`Group by This` adds only** — applied,
it is disabled and names its own cause, because `Remove This Group` is now the
removal (ADR-101).

**An open settings drawer follows a live grouping change.** Its drafts are
seeded at mount, and the grouping write path bumped nothing it watches, so
removing a key from the header menu left the Grouping tab still listing it.
`useSetTableGrouping` now bumps `drawersSyncNonce`, which sorting, pinning and
visibility already did.

**The Sorting tab reads a measure properly.** It looked labels up in the
declared columns only, so a measure sort painted its raw `total_amount:min`
token; it now reads `Minimum of Total Amount`, from a resolver the Grouping tab
shares so the two cannot drift. Measure sorts are also listed after the column
sorts, which is the only order the read applies —
`buildGroupOrderByClause` splices every aggregate term in at the innermost group
key however the rows are dragged.

**The share bar is legible.** Its fill was `brandPrimary`, which is
`#ffffff00` in the light theme and near-black in the dark one. It is now `info`.

**Breaking, and why it is `minor`:** two composition hooks under
`@lcabrera/ui/components/VirtualSelect/hooks` and
`.../VirtualSelectTrigger/hooks` renamed their `isBusy` member to `isInert`,
because it now means "busy **or** disabled" and the old name is the confusion
that caused the shimmer bug in the first place. If you call
`useVirtualSelectDropdown` or `useVirtualSelectTrigger` directly, rename that
member; `VirtualSelect` itself is unchanged apart from the added prop. These
packages are `0.x`, so a break ships as a `minor`.

**The Grouping tab's toolbar matches every other tab's.** Its clear carried the
header menu's `UngroupRowsIcon` where Filters, Sorting and Columns all carry
`EraserIcon`, and it had no reset at all — on the stated grounds that grouping
has no cookie-persisted default to reset _to_. That was never what reset means
here: `useResetSorting` and its siblings re-seed the draft from the **applied**
table state, which grouping has like everything else. **`Reset Grouping`** is
now beside the clear, and `useResetGrouping` is exported from the drawer's
actions.

**The Sorting tab drops the columns a grouped read cannot order.** `toGroupSort`
keeps only the terms naming a group key or a staged measure and silently drops
the rest, so a grid grouped by two keys was offering every other declared column
as a sort that would never run — and `Sort by Column Order` staged all of them
at once. Both Sorting surfaces now read one predicate. Note that a measured
column is out too: summing `total_amount` puts `total_amount:sum` in the read,
not bare `total_amount`. The entries are filtered from the **view** only —
they stay in `sorting`, so clearing the grouping brings them back (ADR-102).
