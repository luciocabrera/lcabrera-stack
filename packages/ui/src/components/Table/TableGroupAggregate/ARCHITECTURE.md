# TableGroupAggregate Architecture

A group row's cell content in every column but the hierarchy one: the aggregates
selected on that column, or a dash saying none were.

Private delegate of the body-cell descriptor, and the `children` of an ordinary
`TableBodyCell` — so it renders content, never a cell
([ADR-065](../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)).

## File Structure

```
TableGroupAggregate/
├── TableGroupAggregate.component.tsx → One span per selected measure, filter indicator, or the dash
├── TableGroupAggregate.types.ts      → TableGroupAggregateProps (columnKey, summary)
├── TableGroupAggregate.stylex.ts     → Value, dimmed absent state, indicator
├── TableGroupAggregate.test.tsx      → Formatting, zero, dash, filter indicator
├── utils/
│   └── resolveAggregateDataType.util.ts → How an aggregate renders, which is not always how its column does
├── ARCHITECTURE.md                   → This file
└── index.ts                          → Barrel export
```

## Props

| Prop        | Type                   | Description                                |
| ----------- | ---------------------- | ------------------------------------------ |
| `columnKey` | `string`               | The column this cell belongs to            |
| `summary`   | `TableGroupRowSummary` | The group's aggregates, count and identity |

## Context Dependencies

| Selector                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `useGetHasColumnFilter` | Whether this column carries a filter — see below |

Read here rather than passed in: the cell that renders the number is the one
that answers for it, and the selector returns a boolean so the subscription is
to the question actually being asked rather than to the filter's contents.

## Several measures in one cell

A column may carry any number of aggregates at once (#831), so this cell renders
**every** entry the row holds for its column, in the order the read emitted
them — which is the order the configuration lists them in.

Where there is more than one, each is prefixed with its function's name. Two bare
numbers side by side cannot say which is the sum and which the average, and
position carries nothing here: the cell is one column wide and both measures sit
in it. Where there is exactly one, the prefix is **absent** rather than
redundant — it would otherwise be noise in every column of every group row.

The **filter indicator is rendered once for the cell**, not once per measure. A
`WHERE` filter belongs to the column and runs before aggregation, so every
measure in the cell is computed over the same surviving rows.

Each measure carries its own `TableGroupShare`, because a share names a
`(columnKey, fn)` pair rather than a column — `sum` and `count` are both
shareable, so a column carrying both takes two independent shares (ADR-086,
widened by #831).

## The dash, and the three states it keeps apart

A cell with no selected aggregate renders an **em dash at reduced opacity** —
not blank, and not zero.

- **Blank is already spoken for.** `renderCellContent` turns a null or undefined
  value into an empty string, and `parseNumberValue` carries the comment that
  says why: _a blank cell is absent, not zero_. In a column that can carry an
  aggregate at all, an empty cell already means _this row has no value here_ — a
  claim about the data. A group row's non-aggregated cell is not that; it is a
  question nobody asked.
- **Zero is wrong in the direction of being believed.** The discriminating case
  is a genuine `sum()` of `0.00` over a group with no discounts: a reader must be
  able to tell that from a column nobody asked for an aggregate on.
- **An unexplained empty cell reads as content that has not arrived.** Only a
  dash keeps "no aggregate", "the aggregate is zero" and "still loading" as three
  distinct states.

**The glyph is not the whole answer.** A standalone em dash may or may not be
announced depending on the reader's punctuation verbosity, so the state is
carried by visually-hidden text beside it rather than by the character. ADR-065
left the cell's accessible equivalent to this slice and asked for it to be
treated as required work rather than a refinement.

## The active-filter indicator

A `WHERE` filter on a column runs **before** aggregation, so a total over a
filtered column is a total over the rows that survived the filter. Filter
`order_status IN ('Shipped')` and roll up over it, and the row labelled
`Grand total` is really "all shipped orders" — correct SQL, and a label that
lies by omission unless the cell says so.

The indicator is a filter glyph with a title and a spoken equivalent, rendered
beside the value whenever the cell's own column carries a filter. It is a UI
obligation rather than a SQL one: nothing about the query is wrong, so there is
nothing for the builder to refuse.

## What it does not do

- **No uniform-value fallback.** A group row shows selected aggregates and
  nothing else — it never falls back to a column's value because every row in the
  group happens to share one. That was rejected on three counts in ADR-065, the
  decisive one being that `GROUP BY` does not return uniformity, so the client
  would have to fetch a group's children to know.
- **No formatting.** The `label` arrives already formatted, because formatting a
  Postgres value needs to know that `count(*)` comes back as a string and that a
  `numeric` aggregate does too. The route's grouped service resolves that.

## Where the value is formatted, and why here

The aggregate arrives **raw** and is formatted in this cell, through the same
`renderCellContent` call a data cell in the same column makes. This is the
opposite of how a group **key** travels, and the asymmetry is deliberate:
nothing in a row resolves a key back to the column it came from, so a key has to
arrive pre-formatted; an aggregate names its `columnKey`, so the columns store
answers with that column's `dataType` and `format` and this cell can do better.

Formatting it service-side instead is what put a raw Postgres `numeric` string
under a currency header — `sum(total_amount)` arrives as `"302540833.38"`, and a
grouped service with no access to the column descriptor has nothing better to do
with it than pass it along. Sharing the renderer rather than reimplementing it is
what keeps a group row's number and the numbers beneath it in one format; two
formatters drift the first time either gains an option.

**An aggregate does not always render as its column does**, which is what
`resolveAggregateDataType` exists for. `sum`/`avg`/`min`/`max` answer in the
column's own units and inherit its type. `count`/`countDistinct` answer "how many
rows" — a tally over a currency column is not money, and inheriting the type
would put a symbol and two decimals on an integer that has neither.
`boolAnd`/`boolOr` answer yes or no whatever they are applied to.

A SQL `NULL` aggregate — `avg` over a group whose rows are all NULL — reaches
this cell as `null` and renders as an absence. That is why the summary guard
checks `value` for **presence** rather than for type: absent is malformed, `null`
is data.
