---
'@lcabrera/ui': minor
---

`TableResponseError` gains a `query-refused` member carrying a `reason` from the new `TableQueryRefusalReason` (`column-not-allowed`, `keyset-sort-missing`, `keyset-cursor-mismatch`, `keyset-sort-not-unique`, `keyset-unique-value-missing`). It mirrors the `query-refused` member `@lcabrera/server` adds to `SerializableDbError`, so a refusal a server returns reaches the grid as itself instead of as `unexpected`.

Breaking for callers: a `switch` over `TableResponseError['kind']` that handles every member must handle `query-refused`.
