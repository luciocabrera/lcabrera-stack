---
'@lcabrera/ui': patch
---

A pinned table cell is opaque again, so the columns scrolling underneath it no
longer show through.

The previous release made a pinned body cell inherit its row's background so it
would pick up a group or subtotal row's tint. That reasoning missed which token
an ordinary row paints: `surfacePrimary` carries alpha in both themes, and it is
the glass surface the design intends. A pinned cell wearing it is see-through,
and a pinned cell is precisely the one the unpinned cells scroll beneath — so
their text was legible on top of it, on every row the stripe did not tint.

Pinned cells take an opaque surface again. Nothing else about pinning changes,
and cells still refuse to shrink under flex.

The tint that motivated the change is not restored by other means. A row tint
that is itself translucent cannot make an opaque cell, so matching the two needs
the tint passed to the cell as its own opaque colour rather than inherited.
