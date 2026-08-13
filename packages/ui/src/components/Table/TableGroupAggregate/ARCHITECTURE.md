# TableGroupAggregate Architecture

A group row's cell content in every column but the hierarchy one: the aggregate
selected on that column, or a dash saying none was.

Private delegate of the body-cell descriptor, and the `children` of an ordinary
`TableBodyCell` — so it renders content, never a cell
([ADR-065](../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)).

## File Structure

```
TableGroupAggregate/
├── TableGroupAggregate.component.tsx → Aggregate value, filter indicator, or the dash
├── TableGroupAggregate.types.ts      → TableGroupAggregateProps (columnKey, summary)
├── TableGroupAggregate.stylex.ts     → Value, dimmed absent state, indicator
├── TableGroupAggregate.test.tsx      → Value, zero, dash, filter indicator
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
