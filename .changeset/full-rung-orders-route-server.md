---
'@lcabrera/server': minor
---

Adds `table-page/create-table-loader-reads.util`. `createTableLoaderReads({ limit, reader })` returns the `fetchPage` and `resolveGroupingCapabilities` of the page a table opens on, from a reader built by `createTablePageReader`. `fetchPage` takes the view's `effectiveSorting`, `filters`, `grouping` and `totalsPlacement`, and reads the first `limit` rows with their total: the sort rules that name a direction become the ORDER BY, the filters become the WHERE, and a grouping with keys switches to the grouped read. Spread the result into a table route loader instead of mapping the view state to a read by hand.
