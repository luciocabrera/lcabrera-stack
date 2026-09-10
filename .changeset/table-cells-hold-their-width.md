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

**A striped row now paints a background on every row, not only even ones.** Its
`backgroundColor` named the `:nth-child(even)` case alone, and StyleX merges by
property rather than by condition — so the rule replaced the row's plain
background outright and an odd row carried no `background-color` at all. Nothing
showed, because the surface behind it matched. It matters now: a pinned cell
inherits its row's background instead of always painting the plain surface, so it
carries the same tint as the rest of a group, subtotal or grand-total row rather
than leaving a seam where the pinned columns end — and inheriting a transparent
background would have let the scrolled columns show through the pinned ones.

The two table cell style modules no longer re-export the shared skeleton token
under a local name; their components read it from the design-system tokens
directly. Nothing published changes — neither module is reachable through this
package's `exports`.
