# TableGroupHeaderRow Architecture

One group of a grouped read, rendered as an ordinary body row: every level of
its key path (column label plus key value), every selected aggregate, and how
many rows it covers.

Private delegate of `TableBodyRows`. Nothing outside the Table renders it.

## File Structure

```
TableGroupHeaderRow/
├── TableGroupHeaderRow.component.tsx  → TableRow + one colSpan'd summary cell
├── TableGroupHeaderRow.types.ts       → TableGroupHeaderRowProps (summary)
├── TableGroupHeaderRow.stylex.ts      → Row tint, cell layout, label/count/icon
├── TableGroupHeaderRow.test.tsx       → Label resolution, row height, colSpan
├── utils/toGroupHeaderSegments.util.ts → Pure: summary + column labels → ordered text segments
├── ARCHITECTURE.md                    → This file
└── index.ts                           → Barrel export
```

## Props

| Prop      | Type                   | Description                                             |
| --------- | ---------------------- | ------------------------------------------------------- |
| `summary` | `TableGroupRowSummary` | `{ aggregates, count, path }` the grouped read attached |

`path` is the group's key values **in key order**, which is what makes a
multi-key group identifiable: with two keys applied a group is the pair, and a
single `columnKey`/`label` could only ever name one of them. A one-key grouping
is the one-element case, not a different shape.

## Context Dependencies

| Selector                      | Purpose                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useGetNormalizedColumns`     | Every column's human label — configuration, not row data. Read once as a map rather than per segment, because a hook cannot be called inside the loop that renders a multi-key path |
| `useGetPinnedColumnPartition` | Rendered column count, for the summary cell's `colSpan`                                                                                                                             |
| `useGetTableRowHeight`        | Read indirectly, through the `TableRow` it composes                                                                                                                                 |

## Why it composes `TableRow`

`TableBody` sizes `<tbody>` as `totalLoadedRows × rowHeight` and derives both
virtualization spacers from the same number, so
`offsetY + visibleRows × rowHeight + bottomSpacerHeight === totalHeight` holds
only while **every** row paints at exactly that height — see
[`TableRow/ARCHITECTURE.md`](../TableRow/ARCHITECTURE.md).

`TableRow` is the single place `rowHeight` is read. Emitting a bare `<tr>` here
and restating the height would satisfy the invariant on the day it was written
and break silently the first time the default moved; composing `TableRow` makes
it hold by construction. The summary cell takes `height: 100%` rather than a
height of its own for the same reason.

`TableBody.grouping.test.tsx` measures the sum off a rendered body whose every
row is a group row, and this component's own suite asserts its inline height is
byte-identical to a detail row rendered beside it.

## What it does not do

- **No expansion.** A flat grouped read returns one row per group and nothing
  under it; expansion state, its group-path keying, and the toggle affordance are
  a later slice (ADR-061 places the state on this same config context).
- **No aggregate selection.** The read applies a fixed `count(*)`; choosing
  aggregates per column is later work.
- **No ARIA role.** Grid semantics land with the focus model
  ([ADR-062](../../../../../../docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md)),
  which annotates every row type in one pass. Annotating this one alone would
  make the grid's roles inconsistent rather than more correct.

## Formatting split

The `label` arrives already formatted. Formatting a Postgres value needs to know
that `count(*)` comes back as a **string** and that a NULL key is a real group
rather than a missing one — both facts of the read, not of the render. The
route's grouped service resolves them (`toOrderGroupRow` in the showcase app) and
hands this component a finished string and a number.

The column _label_, by contrast, is resolved here: it is a property of the
table's configuration, and the summary carries only the column key.
