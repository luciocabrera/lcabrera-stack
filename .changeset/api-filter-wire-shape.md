---
'@lcabrera/api': minor
'@lcabrera/server': minor
'@lcabrera/utils': minor
---

The column filters a paginated read carries in its `filter` param now have a declared shape, and a server refuses a payload that does not match it.

`@lcabrera/api` adds two subpaths. `@lcabrera/api/filters/filters.types` declares `ColumnFilter` and its members, `ColumnFilters` and `ColumnFiltersParse`. `@lcabrera/api/filters/parse-column-filters.util` exports `parseColumnFilters(params)`. It returns `{ kind: 'parsed', filters }` for an absent or well-formed param. It returns `{ kind: 'refused', reason: 'unreadable' }` when the param is not a JSON object, and `{ kind: 'refused', reason: 'invalid-filter', column }` when one entry is not a filter of a known shape. It never throws.

Breaking for callers:

- `PaginatedQuery.filter` is `ColumnFilters` instead of `unknown`. A value that is not a record of column filters no longer compiles.
- `parseTablePageParams` in `@lcabrera/server` returns `{ kind: 'parsed', params }` or `{ kind: 'refused', message, reason }` instead of the params. Read `params` after checking `kind`.
- A `filter` param that is not JSON, is not an object, or holds an entry of no known shape was read as "no filters", and the endpoint returned every row. `resolvePageRead` now returns a refusal, and `createTablePageLoader` answers it with an empty page carrying the refusal message.

`@lcabrera/server/filters/filters.types` re-exports the filter types from `@lcabrera/api` under the same names, so imports from it keep working.

`@lcabrera/utils` adds two guards: `isFiniteNumber` (`@lcabrera/utils/guards/is-finite-number.util`) narrows a value to a number that is not `NaN` or infinite, and `isStringList` (`@lcabrera/utils/guards/is-string-list.util`) narrows a value to an array whose every member is a string.
