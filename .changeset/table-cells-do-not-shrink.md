---
'@lcabrera/ui': patch
---

Stop a grid's cells from shrinking, which was making pinned columns overlap and
lose their borders once the grid scrolled sideways.

A row is a flex container and every cell is a flex item, but no cell declared
`flexShrink: 0`. A cell whose width has been committed — by a drag, a preset, or
the width band a grouped grid applies — could therefore be squeezed back toward
its minimum whenever the row's columns totalled more than the viewport. That is
the same condition that produces the horizontal scrollbar, so the squeeze arrived
exactly when the reader scrolled.

The sticky offset of each pinned column is derived from its declared width, so a
squeezed pinned cell left the next one anchored where the first no longer ended.
Pinned columns drew on top of one another and the covered cell's right border
disappeared under its neighbour. Group-key columns showed it first because a
grouped grid pins every one of them.

A pinned cell now also inherits its row's background instead of always painting
the plain surface, so it carries the same tint as the rest of a group, subtotal
or grand-total row rather than leaving a seam where the pinned columns end.
