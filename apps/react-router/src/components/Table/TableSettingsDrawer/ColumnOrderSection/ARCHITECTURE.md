# ColumnOrderSection Architecture

Column reordering, visibility toggling, and pinning with drag-and-drop.
Uses a nested ColumnOrderSectionContext to manage complex conflict resolution modals.

## File Structure

```
ColumnOrderSection/
├── index.ts                              → Barrel export
├── ColumnOrderSection.component.tsx       → DraggableList + modals
├── ColumnOrderSection.types.ts            → Conflict resolution types
├── ColumnOrderSection.stylex.ts
│
├── ColumnOrderSectionContext/            → Nested context for modal state
│   └── (see ColumnOrderSectionContext/ARCHITECTURE.md)
│
├── ColumnOrderSectionToolbar/            → Order/clear/reset actions
│   ├── index.ts
│   ├── ColumnOrderSectionToolbar.component.tsx
│   ├── ColumnOrderSectionToolbar.types.ts   → { variant? }
│   └── ColumnOrderSectionToolbar.stylex.ts
│
├── OrderConflictModal/                   → Order/pin conflict resolution
│   ├── index.ts
│   ├── OrderConflictModal.component.tsx   → Radio options for resolution
│   ├── OrderConflictModal.types.ts
│   └── OrderConflictModal.stylex.ts
│
├── PinConflictModal/                     → Pin contiguity conflict resolution
│   ├── index.ts
│   ├── PinConflictModal.component.tsx
│   ├── PinConflictModal.types.ts
│   └── PinConflictModal.stylex.ts
│
├── UnpinConflictModal/                   → Unpin gap conflict resolution
│   ├── index.ts
│   ├── UnpinConflictModal.component.tsx
│   ├── UnpinConflictModal.types.ts
│   └── UnpinConflictModal.stylex.ts
│
└── utils/                                → Pin/order conflict utilities
    ├── index.ts
    ├── applyPin.util.ts                   → Apply pin respecting static columns
    ├── buildAllOrderedColumns.util.ts     → Build complete ordered column list
    ├── detectPinOrderConflict.util.ts     → Detect order/pinning conflicts
    ├── getIsContiguousPin.util.ts         → Check pin contiguity
    ├── insertAdjacentToPinnedGroup.util.ts → Insert next to pinned group
    ├── recalculatePinSides.util.ts        → Reassign left/right after reorder
    ├── resolveClosestEdgeSide.util.ts     → Resolve 'closest-edge' to side
    ├── resolvePinOrderConflict.util.ts    → Apply conflict resolution strategy
    └── restoreStaticColumnOrder.util.ts   → Restore static columns to positions
```

## Dependencies

```mermaid
graph LR
  COS["ColumnOrderSection"] --> SidePanelSectionMain
  COS --> SidePanelSectionHeader
  COS --> DraggableList
  COS --> ToggleSwitch
  COS --> LockIcon
  COS --> COSToolbar["ColumnOrderSectionToolbar"]

  COS --> useGetColumns["useGetColumns (TableConfig)"]
  COS --> useGetColumnOrder["useGetColumnOrder (selector)"]
  COS --> useGetColumnPinning["useGetColumnPinning (selector)"]
  COS --> useGetColumnVisibility["useGetColumnVisibility (selector)"]

  COS --> useReorderColumns["useReorderColumns (context action)"]
  COS --> useToggleColumnPin["useToggleColumnPin (context action)"]
  COS --> useToggleColumnVisibility["useToggleColumnVisibility (context action)"]
  useReorderColumns --> GlobalSettings["GlobalSettingsContext order-conflict preference"]

  COS --> useGetConflictModal["useGetConflictModal (context selector)"]
  COS --> useGetOrderConflict["useGetOrderConflict (context selector)"]
  COS --> useGetPinSideModal["useGetPinSideModal (context selector)"]
  COS --> useGetUnpinConflictModal["useGetUnpinConflictModal (context selector)"]

  COS --> PinSideModal["PinSideModal (shared component)"]
  COS --> PinConflictModal
  COS --> UnpinConflictModal
  COS --> OrderConflictModal

  COS --> buildAllOrderedColumns["buildAllOrderedColumns util"]

  COSToolbar --> Button
  COSToolbar --> Icons["ColumnsOrderIcon, EraserIcon, RefreshIcon"]
  COSToolbar --> useOrderBySorting["useOrderBySorting (context action)"]
  COSToolbar --> useClearColumnOrderSection["useClearColumnOrderSection (action)"]
  COSToolbar --> useResetColumnOrderAndVisibility["useResetColumnOrderAndVisibility (action)"]
  COSToolbar --> useGetColumnsSorting["useGetColumnsSorting (selector)"]
  COSToolbar --> useGetColumnPinning2["useGetColumnPinning (selector)"]
  COSToolbar --> useGetColumnVisibility2["useGetColumnVisibility (selector)"]
```

## Render Flow

```mermaid
graph TD
  A["ColumnOrderSection renders"] --> B["Read columns, order, pinning, visibility"]
  B --> C["buildAllOrderedColumns → ordered list"]
  C --> D["Filter to non-render/static columns"]
  D --> E["Map to DraggableItem array"]
  E --> F["Each item: Lock icon + Label + Pin toggle + Show toggle"]

  A --> G["SidePanelSectionHeader"]
  G --> H["ColumnOrderSectionToolbar variant='toolbar'"]

  A --> I["DraggableList → drag-drop reordering"]
  I --> J["useReorderColumns on drop"]

  A --> K["ColumnOrderSectionToolbar variant='footer'"]

  A --> L["PinSideModal (choose left/right)"]
  A --> M["PinConflictModal (non-contiguous pin)"]
  A --> N["UnpinConflictModal (gap in pinned layer)"]
  A --> O["OrderConflictModal (order breaks pinning)"]
```

## Dual Context Architecture

```mermaid
graph TD
  subgraph "TableDrawerContext"
    TDC["columnsStore"]
    TDC_Actions["setColumnsOrder, setColumnPinning, setColumnsVisibility..."]
  end

  subgraph "ColumnOrderSectionContext"
    COSC["modalsStore"]
    COSC_Actions["toggleColumnPin, reorderColumns, toggleColumnVisibility..."]
    COSC_Selectors["getConflictModal, getOrderConflict, getPinSideModal..."]
  end

  COSC_Actions -->|"reads/writes"| TDC
  COSC_Actions -->|"reads/writes"| COSC
```

The ColumnOrderSection uses **two nested contexts**:

- **TableDrawerContext**: column state (order, pinning, visibility)
- **ColumnOrderSectionContext**: modal state (conflict resolution flows)

Actions in ColumnOrderSectionContext read/write to both stores.

## Toolbar Dual-Variant Pattern

| Variant     | Placement              | Button Style            | Labels?        |
| ----------- | ---------------------- | ----------------------- | -------------- |
| `'toolbar'` | SidePanelSectionHeader | `ghost`, `mini`, `auto` | No (icon only) |
| `'footer'`  | Below DraggableList    | `outline`, `sm`, `full` | Yes            |

| Button                     | Action                            | Disabled When             |
| -------------------------- | --------------------------------- | ------------------------- |
| Order by Sorting           | `orderBySorting()`                | No sorting exists         |
| Clear Visibility & Pinning | `clearColumnOrderSection()`       | No pinning or hidden cols |
| Reset Order & Visibility   | `resetColumnOrderAndVisibility()` | Never                     |

## Utility Functions

| Utility                        | Purpose                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `applyPin`                     | Add column to pin side, respecting static positions                             |
| `buildAllOrderedColumns`       | Merge columnOrder with remaining columns                                        |
| `createDraggableItems`         | Maps ordered columns to draggable entries and delegates row content rendering   |
| `derivePinSideResolutionState` | Resolve pin-side choice to direct update or conflict, shared by drawer + header |
| `detectPinOrderConflict`       | Check if new order breaks pin contiguity                                        |
| `getIsContiguousPin`           | Check if pin side maintains contiguity                                          |
| `getPinnedEntries`             | Flatten left/right pinning into keyed entries                                   |
| `insertAdjacentToPinnedGroup`  | Place column next to its pin group                                              |
| `pinAllBetween`                | Pin all columns between edge and target column                                  |
| `recalculatePinSides`          | Reassign left/right based on position after reorder                             |
| `resolveClosestSide`           | Pick nearest pin side from edge distances                                       |
| `resolveClosestEdgeSide`       | Convert 'closest-edge' to actual 'left' or 'right'                              |
| `resolvePinConflictState`      | Shared pin-conflict resolution to next `{ columnOrder, columnPinning }`         |
| `resolvePinOrderConflict`      | Apply one of three order/pin conflict resolutions                               |
| `resolveToggleColumnPinIntent` | Resolves pin/unpin toggle intent into direct update vs modal/auto-accept action |
| `restoreStaticColumnOrder`     | Ensure static columns stay in their original positions                          |
| `restoreStaticPinnedColumns`   | Restores default pin side membership for static columns                         |
| `sortPinnedKeysByOrder`        | Sort pinned keys by latest column order                                         |
