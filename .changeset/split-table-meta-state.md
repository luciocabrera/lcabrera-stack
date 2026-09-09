---
'@lcabrera/ui': minor
---

Split the grid's meta snapshot into capability and chrome types, and keep the
grouping query on the grouping store — including totals placement — so a chrome
patch cannot name a group key. Filter-options and load-more failures write
`TableResponseError` on the store that fetched, not a string on meta.
