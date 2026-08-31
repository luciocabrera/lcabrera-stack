---
'@lcabrera/ui': minor
---

Fold and unfold one group level from its column's header menu.

A column that is an applied group key now offers `Expand This Level` and
`Collapse This Level` beside the two all-groups items. Collapsing folds every
group at that column's level at once and leaves every other level's expansion
exactly as the reader left it; expanding restores them.

Both items read the same foldable set the per-row chevrons are drawn from, so
neither can close a group the grid refused to offer, and a fold made from the
menu is undone from the chevron on the row it left standing.
