# TableBody Utils Architecture

Pure helper utilities used by `TableBody.component.tsx`.

## File Structure

```
utils/
├── ARCHITECTURE.md                        -> This overview
├── buildTableBodyCellDescriptor.util.tsx   -> Derives pure cell-render descriptor data, for a group row and a detail row alike
├── createRenderTableBodyCell.util.ts      -> Binds sizing/pinning, then delegates to renderFromDescriptor
├── renderFromDescriptor.util.ts           -> Turns one cell descriptor into a TableBodyCell element
├── generatePlaceholderData.util.ts        -> Creates placeholder row objects for skeletons
├── renderTableBodyPinnedGroup.util.ts     -> Maps one pinning partition (left/center/right) through the shared cell renderer
├── resolveGroupCellChildren.util.tsx      -> What one cell of a group row holds: label, aggregate, or nothing
└── index.ts                               -> Barrel exports
```

## Utilities

| Utility                        | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| `buildTableBodyCellDescriptor` | Builds default/custom cell descriptor data from a column and row           |
| `resolveGroupCellChildren`     | The three cases a group row's cell can be, in one place                    |
| `createRenderTableBodyCell`    | Creates a row-cell renderer bound to sizing/pinning, delegating the render |
| `renderFromDescriptor`         | Renders a `TableBodyCell` from a built descriptor (custom vs default)      |
| `generatePlaceholderData`      | Creates empty row objects keyed by visible columns                         |
| `renderTableBodyPinnedGroup`   | Maps columns to rendered cells while preserving order and shared row data  |

## Group rows come through the same pipeline

A group row and a detail row share one cell grid
([ADR-065](../../../../../../../docs/decisions/ADR-065-grouped-rows-render-a-hierarchy-column.md)):
the descriptor decides what a cell **holds**, and the chrome around it — the
`gridcell` role, the roving tab stop, the sticky offset, the width — is
identical either way. That is what makes a group row a first-class focus target
with no branch anywhere in the focus model, and it is why the group branch lives
here rather than in `TableBodyRows`.

Four rules, in the order the builder applies them:

| Row    | Column                   | Cell holds                                          |
| ------ | ------------------------ | --------------------------------------------------- |
| Group  | hierarchy                | `TableGroupLabel` — the level, its label, its count |
| Group  | actions                  | nothing: a group is not a row to act on             |
| Group  | any other                | `TableGroupAggregate` — the aggregate, or a dash    |
| Detail | hierarchy or a group key | nothing: stated once, by the group row above        |

The last one is the first rule on the detail path that needs to know a **column**
is a group key, which is why `groupingKeys` is bound into the renderer for the
whole window.

## TableBodyCellDescriptor

Every field of `TableBodyCellDescriptor` exists to be spread into
`TableBodyCell`, so each one is read back off `TableBodyCellProps`
(`readonly minWidth: NonNullable<TableBodyCellProps<TData>['minWidth']>`)
rather than declared independently. Keep it that way when adding a field: a
hand-declared one can be renamed or retyped on the props without anything here
failing, and the mismatch then surfaces as a missing prop at the
`createElement` call in `renderFromDescriptor` instead of at the definition.

`key` and `kind` are the two exceptions, because neither is a prop — `key` is
React's element key, and `kind` is a rendering decision (`custom` for the
actions column and for any column supplying `render()`, `default` otherwise).
The column's own type travels as `dataType` on the default branch, so adding a
`dataType` never grows the union.

## Consumers

- `src/components/Table/TableBody/TableBody.component.tsx` — body cell descriptor and placeholder rows

The spacer row's `colSpan` is **not** computed here. `SpacerRow` derives it
itself from `useGetPinnedColumnPartition`, the same way `TableEmptyState` does.
