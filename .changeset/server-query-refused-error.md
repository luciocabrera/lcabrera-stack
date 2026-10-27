---
'@lcabrera/server': minor
---

A column outside `allowedColumns`, or a keyset cursor that does not match its sort, is now refused with a typed error instead of a plain `Error`.

`@lcabrera/server/errors/query-refused.error` exports `QueryRefusedError`. It is not a `PersistenceError`: nothing reached the database. It carries `reason`, one of the `QueryRefusalReason` values in `errors/errors.types` (`column-not-allowed`, `keyset-sort-missing`, `keyset-cursor-mismatch`, `keyset-sort-not-unique`, `keyset-unique-value-missing`), and `column` when the refusal is about one column. Its message is unchanged.

`toSerializableDbError` maps it to `{ kind: 'query-refused', reason, message }`. The message is a fixed sentence for each reason and does not name the column, so an edge can answer it with a 4xx without echoing request text.

Breaking for callers:

- `SerializableDbError` has a new member, `query-refused`. A `switch` over `kind` that handles every member must handle it.
- These refusals serialised as `{ kind: 'unexpected' }` before. Code that relied on that now receives `query-refused`.
