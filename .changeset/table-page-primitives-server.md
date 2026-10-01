---
'@lcabrera/server': minor
---

Adds `table-page/*`, the pieces that serve a database-backed table page.
Declare the table once with `createTablePageReader({ target, primaryKey,
fallbackSort, defaultLimit, maxLimit, groupMaxRows })` and it returns the read
functions bound to that table:

- `selectPage` clamps the page window and the ORDER BY length, reads rows plus
  an optional total, seeks past a keyset cursor when the sort ends on the
  primary key and uses the offset otherwise, and switches to a grouped read
  when the grouping names a key. A grouping refusal comes back as a
  serializable `error` on the page rather than a thrown class.
- `resolvePageRead` parses a request's `limit`/`skip`/`cursor`/`filter`/`sort`
  search params and scopes the read to a drill-down group when one is named.
- `resolveGroupRead`, `resolveGroupRestriction`, `selectGroupingCapabilities`,
  `selectGroupKeyTruncations` and `deleteRow` are bound to the same table.

Three factories wrap those functions into request handlers that take
`{ request }`: `createTablePageLoader` answers with the page as JSON,
`createGroupDetailReads` returns the `fetchPage` and `resolveLockedFilters` of
a page that opens one group's rows, and `createRowDeleteAction` deletes the row
a `{ intent: 'delete', id }` form names, answering 400 for any other intent or
an id its `parseId` refuses. `toIntegerRowId` is that `parseId` for an integer
key. `parseTablePageParams` and `toKeysetCursor` are exported for a caller that
composes its own read.

The package now declares `@lcabrera/utils` as a dependency.
