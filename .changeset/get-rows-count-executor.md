---
'@lcabrera/server': minor
---

Add the `getRowsCount` executor — the count sibling of `getMaxValue`. It runs
`buildCountQuery` on the pool singleton and returns the matching row count,
requiring an explicit `column` (typically the primary key) so a total is never
an ambiguous `count(*)`. Pass it the same `filters`/`allowedColumns` as the data
query and a page can never drift from its total.
