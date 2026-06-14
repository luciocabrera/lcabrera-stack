# ColumnOrderSectionContext Architecture

Store-based context that manages modal state for the ColumnOrderSection.
Handles complex pin/order conflict detection and resolution flows.

## File Structure

```
ColumnOrderSectionContext/
├── ColumnOrderSectionContext.context.ts       → createContext
├── ColumnOrderSectionContext.provider.tsx      → Provider: creates modalsStore
├── ColumnOrderSectionContext.types.ts          → Modal state types
├── ColumnOrderSectionContext.constants.ts      → Initial modal state defaults
├── index.ts                                    → Barrel export
├── useColumnOrderSectionContextValue.hook.ts   → use(ColumnOrderSectionContext)
├── useModalsStore.hook.ts                      → useSyncExternalStore + selector
│
├── actions/                                    → 12 hooks that write to the store
│   ├── actions/utils/resolveOrderConflictUpdate.util.ts → Shared apply-vs-modal decision for reorder and order-by-sorting flows
│   ├── actions/utils/resolveToggleColumnPinUpdate.util.ts → Shared static-aware pin-toggle intent resolver for toggle pin flow
│   ├── actions/utils/resolveAcceptedOrderConflictState.util.ts → Shared final order/pinning resolver for accepted order conflicts
│   ├── actions/utils/resolveAcceptedPinSideUpdate.util.ts → Shared pin-side acceptance resolver for resolved-vs-conflict outcomes
│   ├── actions/utils/resolveAcceptedUnpinConflictState.util.ts → Shared unpin-conflict resolution for pinning-only vs reorder outcomes
│   ├── useAcceptPinSide                        → Accept pin side selection
│   ├── useAcceptPinConflict                    → Resolve pin contiguity conflict
│   ├── useAcceptUnpinConflict                  → Resolve unpin gap conflict
│   ├── useAcceptOrderConflict                  → Resolve order/pin conflict
│   ├── useCancelPinSide                        → Close PinSideModal
│   ├── useCancelPinConflict                    → Close PinConflictModal
│   ├── useCancelUnpinConflict                  → Close UnpinConflictModal
│   ├── useCancelOrderConflict                  → Close OrderConflictModal
│   ├── useOrderBySorting                       → Reorder columns by sorting
│   ├── useReorderColumns                       → Drag-drop reorder handler
│   ├── useToggleColumnPin                      → Toggle pin (opens modals)
│   └── useToggleColumnVisibility               → Toggle column visibility
│
├── selectors/                                  → 4 hooks that read from the store
│   ├── useGetConflictModal
│   ├── useGetOrderConflict
│   ├── useGetPinSideModal
│   └── useGetUnpinConflictModal
│
└── utils/
    └── getInitialModalsState.util.ts           → Default modal state factory
```

## Store Pattern

```mermaid
graph LR
  subgraph "Parent (TableDrawerContext)"
    TDC["columnsStore"]
  end

  subgraph "ColumnOrderSectionContext"
    Provider["Provider"] -->|"useStore(initialState)"| MS["modalsStore (TStore)"]
    MS -->|"get()"| Get["Snapshot"]
    MS -->|"set(partial)"| Set["Merge & notify"]
  end

  Actions["actions"] -->|read/write| TDC
  Actions -->|read/write| MS
```

## Modal State Shape

```typescript
ColumnOrderSectionModalsState = {
  pinSideModal: {
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
  };
  conflictModal: {                       // Pin contiguity conflict
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
    side: 'left' | 'right';
  };
  unpinConflictModal: {                  // Unpin gap conflict
    columnKey: string;
    columnLabel: string;
    isOpen: boolean;
    side: 'left' | 'right';
  };
  orderConflict: {                       // Order/pin conflict
    description: string;
    isOpen: boolean;
    pendingOrder: ColumnOrderState;
    pendingPinning: ColumnPinningState;
  };
};
```

## Pin/Unpin Flow

```mermaid
graph TD
  A["useToggleColumnPin called"] --> B{"isPinning?"}
  B -->|Yes| C["Open PinSideModal"]
  B -->|No - unpinning| D{"Creates gap in pinned layer?"}
  D -->|No| E["Remove pin directly"]
  D -->|Yes| F["Open UnpinConflictModal"]

  C --> G["User selects left/right"]
  G --> H["useAcceptPinSide"]
  H --> I{"Is pin contiguous?"}
  I -->|Yes| J["Apply pin directly"]
  I -->|No| K["Open PinConflictModal"]

  K --> L["User selects resolution"]
  L --> M["useAcceptPinConflict"]
  M --> N{"Resolution?"}
  N -->|move-column| O["Move column + reorder"]
  N -->|pin-all-between| P["Pin all columns between"]
  N -->|pin-only| Q["Pin without reordering"]

  F --> R["User selects resolution"]
  R --> S["useAcceptUnpinConflict"]
  S --> T{"Resolution?"}
  T -->|unpin-beyond| U["Unpin columns beyond gap"]
  T -->|reorder-to-fill| V["Move columns to fill gap"]
```

## Reorder Flow

```mermaid
graph TD
  A["useReorderColumns (drag-drop)"] --> B["Restore static column positions"]
  B --> C["Recalculate pin sides"]
  C --> D{"Conflicts with pinning?"}
  D -->|No| E["Apply new order + pinning"]
  D -->|Yes| F{"Global order conflict pref saved?"}
  F -->|No| G["Open OrderConflictModal"]
  F -->|Yes| H["Apply saved resolution"]

  G --> I["User selects resolution"]
  I --> J["useAcceptOrderConflict"]
  H --> J
  J --> K{"Resolution?"}
  K -->|remove-conflicting-pins| L["Keep only contiguous pins"]
  K -->|reset-all-pins| M["Clear all pinning"]
  K -->|pin-to-match-order| N["Move pinned columns to edges"]
```

## Conflict Resolution Types

| Conflict Type      | Modal                | Resolutions                                                       |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| Pin side selection | `PinSideModal`       | `left` or `right`                                                 |
| Pin contiguity     | `PinConflictModal`   | `move-column`, `pin-all-between`, `pin-only`                      |
| Unpin gap          | `UnpinConflictModal` | `unpin-beyond`, `reorder-to-fill`                                 |
| Order/pin conflict | `OrderConflictModal` | `remove-conflicting-pins`, `reset-all-pins`, `pin-to-match-order` |

## Shared Action Utility

`useReorderColumns` and `useOrderBySorting` now share a pure action utility,
`resolveOrderConflictUpdate`, to decide whether a proposed order can be applied
directly or must open/auto-accept the order conflict flow.

`useToggleColumnPin` now delegates static-column short-circuit and pin-toggle
intent resolution to `resolveToggleColumnPinUpdate`.

`useAcceptOrderConflict` now delegates the final static-order/static-pinning
composition step to `resolveAcceptedOrderConflictState`.

`useAcceptPinSide` now delegates pin-side acceptance branching to
`resolveAcceptedPinSideUpdate`.

`useAcceptUnpinConflict` now delegates unpin-conflict state transitions to
`resolveAcceptedUnpinConflictState`.
