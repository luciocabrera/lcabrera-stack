---
'@lcabrera/ui': minor
---

`NavLink` takes an optional `isActive`. When it is set, it decides
`aria-current` and the active style in place of the router's match, which
compares only the pathname: a row of links to `?view=a` and `?view=b` on one
page all match it, so without the override every one of them reads as the
current page. Unset, the router decides as before.

`Table` sets every cell of a `number` or `currency` column in tabular figures,
so the digits line up from row to row. That includes a `render` cell, which
still takes its alignment from `align` and not from the `dataType`.
