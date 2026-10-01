---
'@lcabrera/api': minor
---

Adds `table-page/is-table-page-response.util`, a type guard for the envelope a
table-page endpoint returns: a `data` array, a boolean `hasMore`, a numeric
`total` when present, and an `error` or `groupingWarning` tagged by `kind` when
present. Pass a narrower response type as its type argument, for example
`isTablePageResponse<ItemsPage>`, to use it as a paginated fetcher's `isValid`.
`table-page/table-page.types` exports that envelope as `TablePageResponseShape`.
