---
'@lcabrera/api': minor
---

A fetcher built by `createPaginatedFetcher` accepts an optional `group` on each call and sends it as the drill-down group parameter (`OLAP_DRILL_GROUP_PARAM`). One fetcher can now read a table's pages and the pages of one of its groups. `PaginatedFetchArgs` gains the `group` field.
