# TableGroupLabel Architecture

A group row's cell content in the grid-owned **hierarchy column**: its level
and its label.

Private delegate of the body-cell descriptor. Nothing outside the Table renders
it, and it renders no cell of its own — it is the `children` of an ordinary
`TableBodyCell`, so the `gridcell` role, the roving tab stop, the sticky offset
and the width are the same ones every other cell gets
([ADR-065](../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)).

## File Structure

```
TableGroupLabel/
├── TableGroupLabel.component.tsx          → Icon, indent, label
├── TableGroupLabel.types.ts               → TableGroupLabelProps (summary)
├── TableGroupLabel.stylex.ts              → One-line layout, depth indent, subtotal weight
├── TableGroupLabel.test.tsx               → Label, depth, subtotal, grand total, one line
├── utils/toGroupHierarchyLabel.util.ts    → Pure: summary → { depth, isSubtotal, text }
├── ARCHITECTURE.md                        → This file
└── index.ts                               → Barrel export
```

## Props

| Prop      | Type                   | Description                               |
| --------- | ---------------------- | ----------------------------------------- |
| `summary` | `TableGroupRowSummary` | `{ aggregates, count, isSubtotal, path }` |

## What it shows, and why only that

**The innermost key value, not the whole path.** Every level above it is already
stated by the group row this one is indented under, which is the argument for a
hierarchy column over a banner that reprints the path on every row. The outer
levels are recoverable by reading up the column; repeating them is what made the
banner wide.

**Depth is `path.length - 1`.** `path` holds only the keys a row's grouping set
actually grouped by, so its length _is_ the row's depth: a subtotal carries one
entry fewer than the rows it totals, which puts it at its children's parent's
level. The grand total carries none and sits at zero.

**The row count is not here, and its absence is the decision.** ADR-065 puts a
measure in the column it aggregates, under that column's header; a count printed
beside the label was the one measure exempt from that — aligned under nothing and
headed by nothing. A route that wants the number selects a `count` aggregate on a
column, which renders in its own cell like every other aggregate.

`summary.count` stays on the contract for consumers that need the figure without
projecting it, and this component no longer reads it.

## How a real NULL and a structural subtotal stay apart

This is the distinction ADR-065 handed #570, and the hierarchy column is the
only place it can live: a group whose key is genuinely NULL and a subtotal
across every value of that key produce **the same label from the same column**.
Nothing in the text separates them.

`isSubtotal` does, and it turns into three visible differences at once:

| Row                          | `path`            | Depth | Text          | Weight   |
| ---------------------------- | ----------------- | ----- | ------------- | -------- |
| Real NULL country under EMEA | `[EMEA, (empty)]` | 1     | `(empty)`     | semibold |
| Subtotal across countries    | `[EMEA]`          | 0     | `EMEA total`  | bold     |
| Grand total                  | `[]`              | 0     | `Grand total` | bold     |

The flag is carried on the row rather than inferred from the grouping
configuration, because the row is the one thing that survives a configuration
change intact — the table never asks the configuration what a row is.

## The one-line constraint

`TableRow` pins `minHeight`/`maxHeight` alongside `height`, so a label allowed
to wrap is not a taller row — it is a silently clipped one, and `<tbody>`'s
declared height stops matching what is painted. That height is a row count times
`rowHeight`, derived in `TableBody` and stated there rather than repeated here;
what matters at this end is that **every** row paints at exactly `rowHeight`.
The label therefore ellipsizes, which is a truncation the reader can see, and
indentation narrows the text rather than the row.

Indentation is `padding-inline-start` rather than a margin or a nested box:
padding leaves the flex line intact, so the label ellipsizes into whatever width
is left rather than overflowing the cell.

`TableBody.grouping.test.tsx` measures the height identity off a rendered body
whose every row is a group row.
