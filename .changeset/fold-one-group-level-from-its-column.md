---
'@lcabrera/ui': minor
---

Fold and unfold one group level from its column's header menu.

A column that is an applied group key now offers `Expand This Level` and
`Collapse This Level` beside the two all-groups items. Collapsing takes away the
values that column states, by folding every group one level above it, and leaves
every other level's expansion exactly as the reader left it; expanding restores
them. Grouped by `Category › Subcategory › Customer Type`, collapsing on
`Customer Type` keeps both outer levels and their subtotals on screen.

The pair is offered only where a fold would leave a row standing to undo it, so
it is absent on the outermost group key, on a column that is no group key, and
on a `flat` result — one rule read off the same foldable set the per-row chevrons
are drawn from, rather than an index check beside it.
