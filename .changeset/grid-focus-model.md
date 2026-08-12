---
'@lcabrera/ui': minor
---

Give the Table grid semantics and a keyboard.

The Table is styled as a CSS grid so that row virtualization works, and that
takes every row and cell out of the table formatting context — a browser drops
an element's implicit table role along with its table `display`, so assistive
technology saw a pile of generic containers. It also had no way to be operated
from the keyboard.

The grid now declares its roles explicitly (`grid`, `row`, `columnheader`,
`gridcell`), reports `aria-rowcount` over the whole dataset and `aria-rowindex`
as each row's absolute position in it, and announces sort state through
`aria-sort` on every sortable header. Virtualization spacer rows stay hidden
from the accessibility tree.

Exactly one element carries `tabIndex={0}` at any time, so the grid is a single
stop in the page's tab order and is re-entered where it was left. Arrow keys
move one cell, `Home`/`End` move within the row, `Ctrl`/`Cmd` with either moves
to the first or last cell of the grid, and `PageUp`/`PageDown` move by a
viewport of rows. A move whose target is outside the rendered window scrolls it
into view first.

Focus is held as data — a data-derived row key plus a column key — rather than
read back from `document.activeElement`, so a focused row that scrolls out of
the virtualization window and back keeps its focus instead of dropping it to the
document body and silently killing navigation.

The grid's ARIA attributes are applied after forwarded props, so a consumer
cannot replace `role`, `scope`, `aria-sort` or `aria-rowcount` by passing one —
they are the only source of semantics the Table's CSS has stripped, so they are
a contract rather than a default.

**Behaviour change for consumers:** the column resize splitter is no longer its
own tab stop (`tabIndex` is now `-1`). A grid has one roving tab stop, and one
splitter per column is what that replaces; keyboard access to column width is
provided by the column's actions menu. Consumers asserting on the splitter's tab
order, or on the Table's rendered ARIA attributes, will need to update those
expectations.
