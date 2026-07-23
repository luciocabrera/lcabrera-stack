---
'@lcabrera/server': minor
---

Make `SELECT DISTINCT` a generic capability instead of a dropdown-specific one.

- `SelectQueryDescriptor` gains `distinct?: boolean`, so `buildSelectQuery` / `selectRows` emit `SELECT DISTINCT` over a list of columns with the usual filters/sort/pagination. `buildDistinctQuery` and the new `selectDistinctRows` are thin wrappers over them (kept for readability), no longer locked to a single aliased column.
- New `isNotNull` comparison operator (`QueryFilter` is now a discriminated union — unary operators carry no value).
- New `selectFilterOptions` helper: the filter-dropdown specialization built _on top of_ `selectDistinctRows` — one column's distinct, non-empty (empty dropped only for `text` via `ColumnType`), ordered values as a `{ values, hasMore }` page.

Removes the previous single-purpose `selectDistinctValues` / `buildDistinctValuePredicate` (`buildDistinctQuery` no longer aliases to `value`, bakes in a predicate, or restricts to one column).
