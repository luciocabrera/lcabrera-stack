# TableBody Utils Architecture

Pure helper utilities used by `TableBody.component.tsx`.

## File Structure

```
utils/
├── ARCHITECTURE.md                        -> This overview
├── buildTableBodyCellDescriptor.util.ts   -> Derives pure cell-render descriptor data
├── createRenderTableBodyCell.util.ts      -> Binds sizing/pinning and renders TableBodyCell from descriptors
├── generatePlaceholderData.util.ts        -> Creates placeholder row objects for skeletons
├── getTotalVisibleColumnCount.util.ts     -> Computes rendered-column count for spacer row colSpan
├── renderTableBodyColumnGroup.util.ts     -> Maps a column group through the shared cell renderer
└── index.ts                               -> Barrel exports
```

## Utilities

| Utility                        | Description                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `buildTableBodyCellDescriptor` | Builds default/custom cell descriptor data from a column and row             |
| `createRenderTableBodyCell`    | Creates a row-cell renderer bound to sizing/pinning and descriptor rendering |
| `generatePlaceholderData`      | Creates empty row objects keyed by visible columns                           |
| `getTotalVisibleColumnCount`   | Counts pinned, center, and spacer cells to produce the spacer-row span       |
| `renderTableBodyColumnGroup`   | Maps columns to rendered cells while preserving order and shared row data    |

## Consumers

- `src/components/Table/TableBody/TableBody.component.tsx` — body cell descriptor and spacer-row geometry
