---
'@lcabrera/ui': minor
---

A grouped row now reads as a total rather than as a styled data row.

**Aggregates are formatted by the grid, and travel raw.**
`TableGroupAggregateValue.label: string` is replaced by
`value: unknown`. A grouped service no longer formats its measures — it passes
the value through as the database returned it, and the cell renders it with the
column's own `dataType`, `format` descriptor and locale, exactly as a data cell
in that column is rendered. A `sum` under a currency column now renders as
currency instead of as the raw Postgres `numeric` string, and an `avg` honours
that column's fraction digits. `count` renders as a tally even on a currency
column, since it answers "how many rows" rather than an amount.

**Breaking for anyone building a `TableGroupRowSummary`.** Replace each
aggregate's `label` with `value`, and drop the formatting that produced it:

```diff
 aggregates: rows.map(({ columnKey, fn, alias }) => ({
   columnKey,
   fn,
-  label: formatValue(row[alias]),
+  value: row[alias],
 }))
```

`path` entries are unchanged and still carry a formatted `label` — a key cannot
be resolved back to its column client-side, so it has to arrive rendered.

**The hierarchy label no longer prints the group's row count.** A count belongs
in the column it aggregates, under that column's header; select a `count`
aggregate on a column to show it. `TableGroupRowSummary.count` is unchanged and
still carried.

**Group, subtotal and grand-total rows now paint on three different grounds**,
so a total is a different kind of row before its label is read.
