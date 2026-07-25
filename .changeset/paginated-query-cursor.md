---
'@lcabrera/api': minor
---

`buildPaginatedQueryParams` accepts an optional `cursor` — the sort-key tuple of
the last row already loaded — and serializes it as a `cursor` search param for
endpoints that can seek past it instead of counting `skip` rows. `skip` is still
sent alongside, so an endpoint that does not read cursors behaves exactly as
before.
