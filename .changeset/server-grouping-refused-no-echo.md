---
'@lcabrera/server': minor
---

`toSerializableDbError` writes a `grouping-refused` body from a fixed sentence per reason, and no longer echoes a column the read does not list.

A `GroupingRefusedError` with reason `unknown-column` or `duplicate-keys` can name a column taken straight from the request, before the allow-list has accepted it, and its body used to repeat that column in `message` and `column`. Every `grouping-refused` body now carries a fixed sentence for its `reason` instead of the error's message, the same way a `query-refused` body is written. `column` is kept only for the reasons raised after the allow-list accepted the column (`aggregate-not-legal`, `column-axis-too-wide`, `column-not-groupable`, `estimate-too-large`), and `estimatedRows` is kept wherever the error carries it. The error on the server keeps its message, `column` and `cause` for the log.

Breaking for callers:

- The `message` of every `grouping-refused` body changed. A client that matched its text, or showed the numbers in it, now gets a fixed sentence; the bound is still on `estimatedRows`.
- An `unknown-column` or `duplicate-keys` body no longer has `column`.

`SerializableDbError` is unchanged.
