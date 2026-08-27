---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

A table can state a restriction it cannot change, and open at its declared
columns every time.

**`@lcabrera/ui` gains `lockedFilters` on the loader `meta`.** It is a list of
`{ columnKey, label, value }` entries, optionally carrying a `refusal`, and the
Filters tab renders it as its own section above the reader's own filters, with
its own heading and its own count. Nothing there offers a control: it describes
what already scoped the read, so `Clear Filters` and `Reset Filters` cannot reach
it and `Active Filters (n)` still counts only what a reader can take off. A
restriction that could not be read renders its `refusal` rather than an empty
list — an empty list under that heading says the rows are unrestricted, which is
the one thing a refused request does not mean. `toLockedFiltersHeading` renders
the same entries as one line, for a surface with a title rather than a panel.
Nothing here becomes a `ColumnFilter`, and the route's own read is untouched.

**`@lcabrera/ui` gains `isColumnLayoutTransient` on the loader `meta`.** With it,
`columnOrder`, `columnPinning`, `columnSizing` and `columnVisibility` are neither
restored from the persistence cookie nor written to it, so the table paints the
columns the route declared, in declared order, on every request. Both halves are
the feature: reading only would leave a `Set-Cookie` on every layout change and a
header carried on every request afterwards for state nothing reads back. Filters
and sorting are untouched — they travel in the URL. It is for a view a reader
arrives at rather than keeps, such as a modal over one group's rows.

Both are route-declared and re-asserted unconditionally by
`createTableRouteLoader`, so the client-controlled UI-flags cookie can neither
claim nor deny either one.

**Breaking, `@lcabrera/server`: `toGroupHeading` is replaced by
`toGroupRestrictions`,** at `@lcabrera/server/db/olap/to-group-restrictions.util`.
It answers the same parse as a list — one `{ columnKey, label, value }` per group
key, outermost first — rather than as a joined string, so a filters panel and a
dialog title can be rendered from one answer instead of two that can drift.
A caller that wants the old string joins the entries, or uses `@lcabrera/ui`'s
`toLockedFiltersHeading`. `undefined` still means the request named no readable
group, and still may not be read as "nothing restricts these rows".
