# TableHeaderCell Architecture

Interactive column header cell with sorting, pinning, resizing, visibility,
and per-column settings — all consolidated behind a single actions-menu
trigger so narrow columns still show their label instead of being crowded out
by inline icon buttons.

## File Structure

```text
TableHeaderCell/
├── TableHeaderCell.component.tsx        → <th> rendering label + ResizeHandle + TableHeaderActionsMenu
├── TableHeaderCell.types.ts             → TableHeaderCellProps (columnKey, pinInfo)
├── TableHeaderCell.stylex.ts            → Pinned positioning, base cell layout, shimmer
├── TableHeaderCell.test.tsx             → Unit coverage for label/resize/menu wiring
├── index.ts                             → Barrel export
│
├── ResizeHandle/
│   ├── ResizeHandle.component.tsx       → Drag-resize handle; owns useColumnResize + double-click reset
│   ├── ResizeHandle.types.ts            → ResizeHandleProps<TData>
│   ├── ResizeHandle.stylex.ts           → Resize handle line/hover/active styles
│   └── index.ts
│
├── TableHeaderActionsMenu/
│   ├── TableHeaderActionsMenu.component.tsx → Popover menu shell: gates sections + forwards closeMenu
│   ├── TableHeaderActionsMenu.types.ts      → Props (isSortable, isStatic, hasSettings, pinSide, sortDirection)
│   ├── SortActions/                         → Ascending/Descending/Clear Sorting items; owns useSetColumnSorting
│   ├── PinAndHideActions/                   → Pin Left/Pin Right/Hide Column items; owns useSetColumnPinning + useSetColumnVisibility
│   ├── ManageColumnAction/                  → Manage Column item; owns the drawer-open meta actions
│   └── index.ts
│
└── utils/
    ├── getPinnedStyle.util.ts           → Returns left/right pinned StyleX
    └── getShadowStyle.util.ts           → Returns shadow separator StyleX
```

## Props

| Prop           | Type                | Description                      |
| -------------- | ------------------- | -------------------------------- |
| `columnKey`    | `DataKey<TData>`    | Column identifier                |
| `hasSettings`  | `boolean`           | Enables the "Manage Column" item |
| `pinInfo`      | `PinnedColumnInfo?` | Pin side, offset, shadow flags   |
| `customStylex` | `StyleXStyles?`     | Override styles                  |

## Context Dependencies

```mermaid
graph LR
  subgraph "Reads (selectors)"
    S1["useGetColumnSizing"] --> THC
    S2["useGetNormalizedColumn(key)"] --> THC
  end

  THC["TableHeaderCell"]

  THC --> RH["ResizeHandle"]
  THC --> Menu["TableHeaderActionsMenu"]
```

## Actions Menu

A single `MoreVerticalIcon` trigger (`TableActionsPopover`, shared with
`TableRowActionsMenu` — see `components/Table/TableActionsPopover/ARCHITECTURE.md`)
opens a popover built by `TableHeaderActionsMenu`, replacing the previous
inline pin/sort/settings buttons:

- **Sort** (`SortActions`, when `isSortable`): "Ascending"/"Descending" toggle
  the direction on/off exactly like `ColumnSettingsDrawer/SortingSection`
  (`direction === current ? undefined : direction`); "Clear Sorting" appears
  only when a direction is currently applied.
- **Pin** (`PinAndHideActions`, when `!isStatic`): "Pin Left"/"Pin Right"
  toggle via `useSetColumnPinning` directly — no side-selection or conflict
  modal, same silent behavior as `ColumnSettingsDrawer/PinningSection`.
- **Hide Column** (`PinAndHideActions`, when `!isStatic`):
  `useSetColumnVisibility({ columnKey, isVisible: false })` — a single-column,
  table-level visibility action (see `contexts/TableConfig/ARCHITECTURE.md`),
  distinct from the settings-drawer's draft-scoped `useToggleColumnVisibility`.
- **Manage Column** (`ManageColumnAction`, when `hasSettings`): opens the
  per-column `ColumnSettingsDrawer` — identical wiring to the previous
  "Settings for {label}" button (`setTableColumnSelectedKey` +
  `setTableDrawersOpenState({ isColumnSettingsOpen: true,
isTableSettingsOpen: false })`).

Each section is a private-delegate subcomponent (direct file imports, no
barrels — ADR-007) that owns its store-action hooks and click handlers;
`TableHeaderActionsMenu` itself only gates which sections render and forwards
the popover's render-prop `closeMenu` to each section's `onClose`, so every
item closes the popover after firing its action. The menu renders nothing (no
trigger) when the column has no sortable/pinnable/settings affordance at all.

### Resize

`ResizeHandle` fully owns `useColumnResize` (RAF-throttled drag resize) and
the double-click-to-reset-width handler; `TableHeaderCell` only passes
`columnKey`, `columnLabel`, `currentWidth`, `maxWidth`, `minWidth`.

## Loading State

Header cells receive `isLoadingState` from `TableHeader` and render their local
shimmer overlay without subscribing to loading state individually.
