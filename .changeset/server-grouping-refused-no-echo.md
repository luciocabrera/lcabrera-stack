---
'@lcabrera/server': minor
---

`toSerializableDbError` no longer echoes a column the read does not list in a `grouping-refused` body.

A `GroupingRefusedError` with reason `unknown-column` or `duplicate-keys` can name a column taken straight from the request, before the allow-list has accepted it. It now serialises to `{ kind: 'grouping-refused', reason, message }` with a fixed sentence for the reason and no `column`, the same way a `query-refused` body is written. The error on the server keeps its message, `column` and `cause` for the log.

Every other grouping reason names a column only after it passed the allow-list, so its body is unchanged.

Breaking for callers: a client that read `column` or the message text of an `unknown-column` or `duplicate-keys` refusal no longer receives them. `SerializableDbError` is unchanged.
