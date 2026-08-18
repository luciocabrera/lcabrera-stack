---
'@lcabrera/ui': minor
---

A grouped Table now renders each group key's value in that key's **own column**
rather than in a grid-owned hierarchy column, and reads a row's level from which
key columns are filled rather than from an indent
([ADR-080](https://github.com/luciocabrera/vite-react-compiler/blob/main/docs/decisions/ADR-080-a-group-key-renders-in-its-own-column.md)).

Four things this fixes, three of them visible before:

- A `flat` grouping rendered no hierarchy at all — every row sat at the same
  depth and only the innermost key was drawn, so grouping by four keys showed
  one.
- A `rollup` stated a group's identity _after_ the rows it totalled.
- A key column had no header of its own, so sorting or filtering by a group key
  had no in-grid home.
- A lattice result could not be rendered at all, which is why `cube` is absent
  from `TableGroupingMode` while `@lcabrera/server` has emitted it since #574.
  Nothing in the rendering stands in the way now; admitting the mode is separate
  work.

While grouping is applied the key columns are hoisted to the head of the column
order and the left pin, in key order, and forced visible. That is a derivation
and never state — your `columns`, `columnOrder`, `columnPinning` and
`columnVisibility` are untouched, so ungrouping restores the layout exactly. A
group key is locked against dragging and hiding while grouped, but keeps its
width and its header menu.

**Breaking for anyone reaching past the public surface:** the synthetic
hierarchy column is gone, along with `TABLE_GROUP_HIERARCHY_COLUMN_KEY` and the
`table-group-label` test id. A grouped row now paints exactly the columns you
declared — one cell fewer per row.
