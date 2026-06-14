# TableHeaderCell Architecture

Interactive column header cell with sorting, pinning, resizing, and
column settings controls. The most complex cell component in the table.

## File Structure

```
TableHeaderCell/
├── TableHeaderCell.component.tsx   → <th> with sort/pin/resize/settings controls
├── TableHeaderCell.types.ts        → TableHeaderCellProps (columnKey, pinInfo)
├── TableHeaderCell.stylex.ts       → Pinned positioning, resize handle, shimmer
├── index.ts                        → Barrel export
│
├── SortIcon/
│   ├── SortIcon.tsx                → Renders asc/desc/neutral icon
│   ├── SortIcon.types.ts           → SortIconProps (direction)
│   └── index.ts
│
└── utils/
    ├── getNextSortDirection.util.ts → Cycle: undefined → asc → desc → undefined
    ├── getPinnedStyle.util.ts       → Returns left/right pinned StyleX
    ├── getShadowStyle.util.ts       → Returns shadow separator StyleX
    └── index.ts
```

## Props

| Prop           | Type                | Description                    |
| -------------- | ------------------- | ------------------------------ |
| `columnKey`    | `DataKey<TData>`    | Column identifier              |
| `hasSettings`  | `boolean`           | Show settings (gear) button    |
| `pinInfo`      | `PinnedColumnInfo?` | Pin side, offset, shadow flags |
| `customStylex` | `StyleXStyles?`     | Override styles                |

## Context Dependencies

```mermaid
graph LR
  subgraph "Reads (selectors)"
    S1["useGetColumnSizing"] --> THC
    S2["useGetNormalizedColumn(key)"] --> THC
  end

  THC["TableHeaderCell"]

  subgraph "Writes (actions)"
    THC --> A1["useSetColumnSizing"]
    THC --> A2["useSetColumnPinning"]
    THC --> A3["useSetColumnSorting"]
    THC --> A4["useSetTableColumnSelectedKey"]
    THC --> A5["useToogleTableIsColumnSettingsOpen"]
    THC --> A6["useAcceptHeaderPinSide"]
    THC --> A7["useAcceptHeaderPinConflict"]
  end
```

## Interactions

### Sort

```mermaid
graph LR
  Click["Click sort button"] --> Next["getNextSortDirection()"]
  Next --> Set["setSorting({ columnKey, direction })"]
```

Cycles through `undefined → asc → desc → undefined`.

### Pin

```mermaid
graph TD
  Click["Click pin button"] --> Check{"Already pinned?"}
  Check -->|Yes| Unpin["setColumnPinning({ columnKey, side: undefined })"]
  Check -->|No| PrefCheck{"Global pin-side pref saved?"}
  PrefCheck -->|Yes| AutoPin["handlePinAccept(savedPref) — skip modal"]
  PrefCheck -->|No| Modal["Open PinSideModal"]
  Modal --> Accept["handlePinAccept(pinSide)"]
  AutoPin --> Accept
  Accept --> PinAction["acceptHeaderPinSide({ columnKey, pinSide })"]
  PinAction --> Conflict{"Pin conflict?"}
  Conflict -->|No| Done["Column pinned"]
  Conflict -->|Yes| ConflictPrefCheck{"Global conflict pref saved?"}
  ConflictPrefCheck -->|Yes| AutoConflict["handlePinConflictAccept(savedPref) — skip modal"]
  ConflictPrefCheck -->|No| ConflictModal["Open PinConflictModal"]
  ConflictModal --> Resolve["handlePinConflictAccept(resolution)"]
  AutoConflict --> Resolve
  Resolve --> acceptHeaderPinConflict["acceptHeaderPinConflict({ resolution })"]
```

Runtime prompt selections in this component resolve the current pinning action only and do not persist global preferences.

### Resize

Uses `useColumnResize` hook with RAF-throttled mouse tracking.
Double-click on resize handle resets column to auto width.

### Settings

Opens `ColumnSettingsDrawer` by setting the selected column key
and setting `isColumnSettingsOpen = true` while forcing
`isTableSettingsOpen = false` in meta state, so per-column
settings takes precedence over table settings.

## Loading State

Header cells receive `isLoadingState` from `TableHeader` and render their local
shimmer overlay without subscribing to loading state individually.
