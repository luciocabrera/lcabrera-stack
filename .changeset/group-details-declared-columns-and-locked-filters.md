---
'@lcabrera/server': minor
'@lcabrera/ui': minor
---

A table can state a restriction it cannot change, and a view arrived at can open
at its declared columns every time (ADR-094).

**`@lcabrera/ui` gains `lockedFilters` on the loader `meta`.** Entries of
`{ columnKey, label, value }` plus an optional `refusal`, rendered by the filters
panel as its own section above the reader's own filters, with its own heading and
count. It offers no control, so `Clear Filters` and `Reset Filters` cannot reach
it and `Active Filters (n)` still counts only what a reader can take off. A
restriction that could not be read renders its `refusal` rather than an empty
list. `toLockedFiltersHeading` renders the same entries as one line for a surface
with a title rather than a panel. Nothing here is a `ColumnFilter` and nothing
derived from it narrows a read.

**`@lcabrera/ui` gains `isColumnLayoutTransient` on the loader `meta`.** With it,
`columnOrder`, `columnPinning`, `columnSizing` and `columnVisibility` are neither
restored from the persistence cookie nor written to it, so the grid paints its
declared columns in declared order on every request. The write half is part of the
feature: without it a layout change costs a `Set-Cookie` and a header carried on
every later request for state nothing reads, and the persistence action reports
success for a write it did not make. Filters and sorting are untouched — they
travel in the URL.

Both are route-declared and re-asserted unconditionally by
`createTableRouteLoader`, so the client-controlled UI-flags cookie can neither
claim nor deny either one.

**Breaking, `@lcabrera/server`: `toGroupHeading` is replaced by
`resolveGroupRestriction`,** at
`@lcabrera/server/db/olap/resolve-group-restriction.util`. It answers the same
request as a list — one `{ columnKey, label, value }` per group key, outermost
first — instead of a joined string, and it refuses rather than returning nothing.
It refuses on the same conditions as `resolveGroupRead`, in the same order and
out of the same message map, so a surface stating the restriction and a surface
rendering the refused page cannot say different things about one request. A
caller that wants the old string joins the entries, or uses `@lcabrera/ui`'s
`toLockedFiltersHeading`.

Migration: replace

```ts
toGroupHeading({ columns, params, truncations });
```

with

```ts
const restriction = await resolveGroupRestriction({
  columns,
  isGroupRequired: true,
  params,
  selectTruncations,
});
```

`truncations` is no longer passed in; `selectTruncations` is the same catalogue
lookup `resolveGroupRead` already takes, and it is called only when the token
carries granularities.
