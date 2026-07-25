---
'@lcabrera/ui': minor
---

`dataTotalSelector` may now return `undefined`, and the Table keeps the total it
already holds when it does. The total of a filtered set cannot change within a
scroll session, so re-counting it on every load-more page is work with a known
answer — a server can now count once, on the first page, and omit it thereafter.

Existing selectors are unaffected: returning a `number` (including `0`) still
sets the total exactly as before, and a table with no selector still falls back
to the number of loaded rows.

`Pagination` also gains an optional `lastRow` and a `TData` type parameter
(defaulting to `unknown`, so a bare `Pagination` still means what it did).
`onLoadMore` now receives the last row the table holds, which is what a keyset
data source needs to resume from — `skip` cannot express "resume after this
row", and only the consumer knows which of the row's fields make up its sort
key. Prefetched pages carry the same anchor, so they stay in step.
