---
'@lcabrera/ui': minor
---

Let a grouped Table expand and collapse, and announce itself as a tree.

A grouped result rendered every level at once and could not be folded, so a deep
grouping was unreadable on screen and unusable from the keyboard. Group rows now
expand and collapse, and the grid upgrades to `role="treegrid"` while its rows
are a tree.

Expansion is keyed by **group path**, never by row index. That is what lets it
be re-applied after the loader re-runs: a sort change reorders rows without
touching any group's key values, so every collapse survives it, while a filter
change that removes a group drops that path rather than leaving it to
re-collapse the group later if a filter brings it back. It is client state and
does not travel in the URL, so a shared link carries the analysis and not the
reading position.

The tree defaults to fully expanded. A grouped read returns whole, so every
level is already in memory by the time the grid paints it — collapsing by
default would hide data that has already been fetched and save nothing.

Every row of a tree states its `aria-level`, `aria-posinset` and `aria-setsize`,
group rows and detail rows alike, and `aria-expanded` appears only on a row that
actually has children. A row's level comes from its group's own path rather than
from its position among the rows. `ArrowRight` expands a collapsed group and
`ArrowLeft` collapses an open one; on a row already in that state both keys stay
ordinary cell navigation, so nothing is lost and the fallback is one more press.

Collapsing changes the row count and never the row height, so the virtualization
height invariant holds in both states: `<tbody>`, both spacers, `aria-rowcount`,
every `aria-rowindex` and the focus model's row index all count the rows a
collapse leaves standing. When a collapse hides the row holding focus, focus
moves to the collapsed group row — its nearest surviving ancestor — rather than
to whatever row shifted up into the vacated index, which is usually a row in a
different group.

**For consumers:** a grouped Table's `role` is now `treegrid` rather than
`grid`, and its `aria-rowcount` counts visible rows while grouping is applied.
Tests querying `getByRole('grid')` against a grouped table, or asserting a row
count over the whole dataset, need updating. An ungrouped Table is unchanged in
every respect, down to the rendered markup.
