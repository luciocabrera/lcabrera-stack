---
'@lcabrera/ui': minor
---

A group's path now carries its key **values**, not only their labels.

`TableGroupKeyValue` gains `readonly value: unknown` beside its existing
`label`. The label is unchanged and stays formatted — it is what the hierarchy
column renders, and only the service that read the row can produce it, since
nothing downstream resolves a path entry back to a column descriptor.

**Why both.** Formatting is lossy in exactly the direction a query needs. A NULL
group key renders as `(empty)`, a date as an ISO string, a boolean as `'true'` —
so a filter built from the label reads `category = '(empty)'` and matches
nothing, silently, on the group a user is most likely to click into. The raw
value is what a drill turns back into the restriction the group came from
(ADR-079). This is the same split `TableGroupAggregateValue` already carries
after the aggregate fix: the display string and the datum answer two questions.

**Breaking for anyone building a `TableGroupRowSummary`.** Supply the raw column
value alongside the label you already produce:

```diff
 path: groupedKeys.map((columnKey) => ({
   columnKey,
   label: toGroupLabel(row[columnKey]),
+  value: row[columnKey],
 }))
```

The summary guard checks `value` for **presence**, not type — `null` is a
legitimate key and a NULL group is a group, while an entry carrying no `value`
key at all is malformed and refuses the whole summary.

**Stored expansion state is unaffected.** `resolveGroupPathKey` still encodes
`[columnKey, label]` only, so a collapse persisted before this change still
matches its row. That is pinned by a test rather than left to inspection —
adding `value` to the encoding would silently re-expand every stored collapse.
