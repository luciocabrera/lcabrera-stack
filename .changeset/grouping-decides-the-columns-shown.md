---
'@lcabrera/ui': minor
---

While a grouping is applied, the grid shows the columns the grouping names — the
group keys in key order, then the measures — and the settings drawer's Columns
tab shows that same set.

A grouped grid used to paint every remaining declared column beside them, each
one an em dash on every row, because nothing removed the columns the grouping did
not name. A third derivation step now does, alongside the two that already
measure and hoist, so it reaches neither the persisted column layout nor the list
the drawer offers: clearing the grouping restores the consumer's own order,
pinning and visibility exactly, as before.

A measured **primary-key** column is now replaced by its measures like any other,
so its header band spans its measures alone and no empty column is rendered
beside them. A row id is resolved from the columns a consumer declared and never
from the painted list, so row actions keep resolving wherever they did.

The Columns tab reads that one derivation rather than building a second answer of
its own: `Show` is on for a column the grid paints, the painted columns are listed
first in the order the grid paints them, and the header count is the size of that
set. Every declared column is still listed. Turning one **on** while grouped is
now a request to add it to the grouping, so a prompt asks how — as a group key, or
with one of the aggregates that column supports — and applies the choice to the
grouping, taking the column off the hidden set at the same time. A column the
grouping already names is simply shown again, with no prompt. When there is
nothing to offer, the report names its cause — the key limit, an exhausted
column, the distinct-count budget, or a column the endpoint offers in neither
role — rather than claiming the column can be neither. Turning a column off is
unchanged.

While grouping is applied no row in that tab is draggable, because the order it
shows is derived for its whole length and a drag would persist a derivation as
the consumer's own column order. Dragging is unaffected once the grouping clears.
