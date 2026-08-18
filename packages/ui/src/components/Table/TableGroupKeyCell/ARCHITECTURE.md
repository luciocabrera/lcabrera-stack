# TableGroupKeyCell

A group row's cell content in one of its **own** key columns: that key's value,
under that key's header
([ADR-080](../../../../../../docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)).

Private delegate of `resolveGroupCellChildren`; nothing outside the Table uses
it. It replaces `TableGroupLabel`, which rendered an indented label in a
grid-owned hierarchy column that no longer exists.

## File Structure

```
TableGroupKeyCell/
├── TableGroupKeyCell.component.tsx        → The cell: drawn value, carried value, or nothing
├── TableGroupKeyCell.types.ts
├── TableGroupKeyCell.stylex.ts
├── utils/resolveGroupKeyCellText.util.ts  → Pure: what this column holds for this row, if anything
└── index.ts
```

## Depth is which column is filled

The retired hierarchy column read depth as `path.length - 1` and drew
`path.at(-1)`. Both are properties of a **tree**, and only `flat` and `rollup`
produce one: their grouping sets are prefixes of the key list, so every row has
at most one parent and its path length is its depth.

`cube` emits every subset. A row carrying the second key and not the first is
the child of nothing, `path.length - 1` is not a depth, and two different
grouping sets can produce byte-identical rows. Reading the level off **which key
column is filled** is the one rendering that serves both — and it is why
`TableGroupingMode` can now admit the mode the server has emitted since #574.

So this component never consults `path.length`. It asks `path` for an entry
whose `columnKey` is this column's, which is a question a lattice answers as
well as a tree does.

## The three states

| State       | When                                              | Renders                                     |
| ----------- | ------------------------------------------------- | ------------------------------------------- |
| **Drawn**   | the row carries this level and does not repeat it | the value, plus the disclosure if innermost |
| **Carried** | the level repeats the row directly above          | visually-hidden text only                   |
| **Absent**  | the row's grouping set does not include this key  | nothing — `null`, so the `<td>` stays empty |

**Absent is the ordinary case, not an error.** A rollup subtotal carries one
entry fewer than the rows it totals; a cube row carries an arbitrary subset. Most
grouped results leave some key columns empty on some rows, and that emptiness is
the depth signal rather than a gap in the data.

**A carried cell is announced even though it is blank.** An empty cell announces
as empty, so an ancestor that is only implied would reach a screen reader
nowhere. The value goes in visually-hidden text — the row stays a complete
sentence while staying quiet on screen. `resolveCarriedGroupKeys` decides
carrying, off the **loaded** row array, and refills at the top of the rendered
window where there is no row above to have stated the level.

## Two placements that are decisions

**The subtotal suffix goes on the innermost level only.** A subtotal states its
ancestry exactly as a leaf group does; the one column where the two differ is the
level being totalled, and that is where `total` belongs. On every filled column
it would read as several totals rather than one.

**The grand total is placed on the first key column.** It is keyed by nothing, so
it belongs to no column on its own — and leaving it unplaced would render a row
of aggregates with nothing anywhere saying what they total. The outermost key is
the column its total is across.

## One line, always

`TableRow` clamps `minHeight`/`maxHeight` to the store's `rowHeight`, so a value
allowed to wrap is not a taller row — it is a silently clipped one, and
`<tbody>`'s declared height stops matching what is painted (ADR-065). The text
ellipsizes instead, which is a truncation the reader can see.
