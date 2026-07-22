# TableBody Utils Architecture

Pure helper utilities used by `TableBody.component.tsx`.

## File Structure

```
utils/
├── ARCHITECTURE.md                        -> This overview
├── buildTableBodyCellDescriptor.util.tsx   -> Derives pure cell-render descriptor data
├── createRenderTableBodyCell.util.ts      -> Binds sizing/pinning, then delegates to renderFromDescriptor
├── renderFromDescriptor.util.ts           -> Turns one cell descriptor into a TableBodyCell element
├── generatePlaceholderData.util.ts        -> Creates placeholder row objects for skeletons
├── getTotalVisibleColumnCount.util.ts     -> Computes rendered-column count for spacer row colSpan
├── renderTableBodyPinnedGroup.util.ts     -> Maps one pinning partition (left/center/right) through the shared cell renderer
└── index.ts                               -> Barrel exports
```

## Utilities

| Utility                        | Description                                                                |
| ------------------------------ | -------------------------------------------------------------------------- |
| `buildTableBodyCellDescriptor` | Builds default/custom cell descriptor data from a column and row           |
| `createRenderTableBodyCell`    | Creates a row-cell renderer bound to sizing/pinning, delegating the render |
| `renderFromDescriptor`         | Renders a `TableBodyCell` from a built descriptor (custom vs default)      |
| `generatePlaceholderData`      | Creates empty row objects keyed by visible columns                         |
| `getTotalVisibleColumnCount`   | Counts pinned, center, and spacer cells to produce the spacer-row span     |
| `renderTableBodyPinnedGroup`   | Maps columns to rendered cells while preserving order and shared row data  |

## Consumers

- `src/components/Table/TableBody/TableBody.component.tsx` — body cell descriptor and spacer-row geometry
