---
'@lcabrera/ui': minor
---

Let a measure be pinned, offer the aggregate functions only where they do
something, widen the measure columns for their share bar, and reach a tab the
drawer is too narrow to show.

**Pinning a measure is allowed again, and it moves the whole band.** The
previous release disabled Pin Left, Pin Right and Clear Pinning on a measure
because the action resolves back to the column it measures and expands into all
of that column's measures. Pinning `Sum` therefore pins `Total Amount`, and
`Minimum`, `Maximum` and `Sum` travel together — a wider gesture than the one
asked for, but the one their shared header band can draw. The three items are
enabled, each carrying a `title` that says so. A group key still refuses all
three: it is force-pinned left on every derivation, so the click would be
discarded.

**The per-column settings drawer answers the same way.** Its Pinning tab
offered a group key a side the next derivation threw away, and its Clear Pinning
appeared to undo the hoist. Both are disabled there now, with the same sentence.
The drawer's write path maps a measure's pinning — and only its pinning — back
to the column it measures, so the drawer and the header menu do the same thing,
and the tab opens on the side the band actually holds.

**The aggregate functions leave the header menu while the grid is flat.** An
aggregate applied with no group keys has no group row to state a value in, so
the function list and `No Aggregate` are offered only once a grouping is
applied. The grouping commands beside them are unchanged, because they are how
a grouping starts. Once grouped, opening the menu **on a measure** now offers
its source column's functions with the applied one pressed, so a `Sum` column
can be switched to `Average` without going back to the column it measures.

**Measure columns start wider.** A derived measure inherited the `minWidth` of
the column it measures, leaving no room for the share-of-grand-total bar and its
percentage beside a value that is already the widest thing the column holds.
Each measure column now starts at a floor of its own, never crossing a
`maxWidth` the column declares and never narrowing a source already wider than
it. **A grouped grid's measure columns are wider on upgrade.** Resizing one
still works and still persists.

**A tab strip too wide for its panel can now be scrolled.** `Tabs` clipped the
tabs that did not fit — in a narrow settings drawer the last tabs were
unreachable by mouse. The strip scrolls horizontally, with a chevron appearing
at each edge only while there is something in that direction, and the selected
tab is brought into view when it changes. Keyboard navigation is unchanged.
