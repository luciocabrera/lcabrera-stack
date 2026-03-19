# SortingSection Architecture

Multi-sort management with add/remove/reorder and toolbar actions.
Orchestrates AddSortSection, ActiveSortList, and SortingSectionToolbar.

## File Structure

```
SortingSection/
├── index.ts                          → Barrel export
├── SortingSection.component.tsx       → Orchestrator: manages isDropdownOpen state
├── SortingSection.types.ts            → SortItem type
│
├── AddSortSection/                   → Dropdown to add new sort columns
│   ├── index.ts
│   ├── AddSortSection.component.tsx   → VirtualSelect for column selection
│   ├── AddSortSection.types.ts        → Props: onDropdownOpenChange
│   └── AddSortSection.stylex.ts
│
├── ActiveSortList/                   → Draggable list of active sorts
│   ├── index.ts
│   ├── ActiveSortList.component.tsx   → DraggableList with direction toggles
│   └── ActiveSortList.stylex.ts
│
├── SortingSectionToolbar/            → Sort actions toolbar
│   ├── index.ts
│   ├── SortingSectionToolbar.component.tsx  → Dual-variant sort actions
│   ├── SortingSectionToolbar.types.ts       → { variant? }
│   └── SortingSectionToolbar.stylex.ts
│
└── utils/
    ├── index.ts
    └── getSelectedColumnLabel.util.ts → Label for selected sortable column
```

## Dependencies

```mermaid
graph LR
  SS["SortingSection"] --> SidePanelSectionMain
  SS --> SidePanelSectionOverlay
  SS --> AddSort["AddSortSection"]
  SS --> ActiveSort["ActiveSortList"]
  SS --> SSToolbar["SortingSectionToolbar"]

  AddSort --> VirtualSelect
  AddSort --> SidePanelSectionHeader
  AddSort --> useGetColumns["useGetColumns (TableConfig)"]
  AddSort --> useGetColumnsSorting["useGetColumnsSorting (selector)"]
  AddSort --> useSetColumnsSortings["useSetColumnsSortings (action)"]
  AddSort --> getSelectedColumnLabel["getSelectedColumnLabel util"]

  ActiveSort --> DraggableList
  ActiveSort --> SidePanelSectionHeader
  ActiveSort --> Button
  ActiveSort --> InfoBox
  ActiveSort --> Icons["SortAscIcon, SortDescIcon, MenuCloseIcon"]
  ActiveSort --> SSToolbar2["SortingSectionToolbar variant='toolbar'"]
  ActiveSort --> useGetColumns2["useGetColumns (TableConfig)"]
  ActiveSort --> useGetColumnsSorting2["useGetColumnsSorting (selector)"]
  ActiveSort --> useSetColumnsSortings2["useSetColumnsSortings (action)"]

  SSToolbar --> Button2["Button"]
  SSToolbar --> Icons2["ListOrderedIcon, EraserIcon, RefreshIcon"]
  SSToolbar --> useSortByColumnOrder["useSortByColumnOrder (action)"]
  SSToolbar --> useClearSorting["useClearSorting (action)"]
  SSToolbar --> useResetSorting["useResetSorting (action)"]
  SSToolbar --> useGetColumnsSorting3["useGetColumnsSorting (selector)"]
```

## Render Flow

```mermaid
graph TD
  A["SortingSection renders"] --> B["Manage isDropdownOpen state"]
  B --> C["AddSortSection"]
  C --> D["VirtualSelect with sortable columns (not yet sorted)"]
  D --> E{"Column selected?"}
  E -->|Yes| F["Add sort with 'asc' direction"]

  B --> G["SidePanelSectionOverlay (hidden when dropdown open)"]
  G --> H["ActiveSortList"]
  H --> I["SidePanelSectionHeader + toolbar variant"]
  H --> J["DraggableList of sort items"]
  J --> K["Per sort: direction toggle + remove button"]

  G --> L["SortingSectionToolbar (footer variant)"]
```

## Component Responsibilities

| Component               | Manages                   | Uses From Context                                            |
| ----------------------- | ------------------------- | ------------------------------------------------------------ |
| `SortingSection`        | `isDropdownOpen`          | —                                                            |
| `AddSortSection`        | Column selection dropdown | `useGetColumnsSorting`, `useSetColumnsSortings`              |
| `ActiveSortList`        | Drag-reorder, remove      | `useGetColumnsSorting`, `useSetColumnsSortings`              |
| `SortingSectionToolbar` | Sort/clear/reset actions  | `useSortByColumnOrder`, `useClearSorting`, `useResetSorting` |

## Toolbar Dual-Variant Pattern

| Variant     | Placement             | Button Style            | Labels?        |
| ----------- | --------------------- | ----------------------- | -------------- |
| `'toolbar'` | ActiveSortList header | `ghost`, `mini`, `auto` | No (icon only) |
| `'footer'`  | Below sort list       | `outline`, `sm`, `full` | Yes            |

| Button               | Action                        | Disabled When     |
| -------------------- | ----------------------------- | ----------------- |
| Sort by Column Order | `sortByColumnOrder()`         | Never             |
| Clear Sorting        | `clearSorting()`              | No sorting exists |
| Reset Sorting        | `resetSorting()` (from table) | Never             |
