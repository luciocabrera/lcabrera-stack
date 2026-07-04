# SortingSection Architecture

Sort direction toggle (ascending/descending) with clear/reset toolbar.

## File Structure

```
SortingSection/
├── index.ts                        → Barrel export
├── SortingSection.component.tsx    → Asc/desc toggle buttons
├── SortingSection.types.ts         → Props: Record<string, never>
├── SortingSection.stylex.ts        → Delegates to drawerSectionStyles.list
│
└── SortingSectionToolbar/
    ├── index.ts                    → Barrel export
    ├── SortingSectionToolbar.component.tsx → Clear/reset sorting buttons
    ├── SortingSectionToolbar.types.ts     → { variant?: 'footer' | 'toolbar' }
    └── SortingSectionToolbar.stylex.ts    → Delegates to drawerSectionStyles
```

## Dependencies

```mermaid
graph LR
  SS["SortingSection"] --> SidePanelSection
  SS --> SidePanelSectionHeader
  SS --> SidePanelSectionMain
  SS --> Button
  SS --> Icons["SortAscIcon, SortDescIcon"]
  SS --> SSToolbar["SortingSectionToolbar"]

  SS --> useGetColumnSorting["useGetColumnSorting (selector)"]
  SS --> useSetColumnSorting["useSetColumnSorting (action)"]

  SSToolbar --> Button2["Button"]
  SSToolbar --> Icons2["EraserIcon, RefreshIcon"]
  SSToolbar --> useResetColumnSorting["useResetColumnSorting (action)"]

  SS_stylex["SortingSection.stylex"] --> drawerSectionStyles
  SST_stylex["SortingSectionToolbar.stylex"] --> drawerSectionStyles
```

## Render Flow

```mermaid
graph TD
  A["SortingSection renders"] --> B["useGetColumnSorting → current direction"]
  B --> C["SidePanelSectionMain"]
  C --> D["SidePanelSectionHeader + SortingSectionToolbar variant='toolbar'"]
  C --> E["Ascending button"]
  C --> F["Descending button"]
  C --> G["SortingSectionToolbar variant='footer'"]

  E --> H{"Click Ascending"}
  H -->|"Already 'asc'"| I["setColumnSorting(undefined)"]
  H -->|"Not 'asc'"| J["setColumnSorting('asc')"]

  F --> K{"Click Descending"}
  K -->|"Already 'desc'"| L["setColumnSorting(undefined)"]
  K -->|"Not 'desc'"| M["setColumnSorting('desc')"]
```

## Toolbar Dual-Variant Pattern

| Variant     | Placement              | Button Style            | Labels?        |
| ----------- | ---------------------- | ----------------------- | -------------- |
| `'toolbar'` | SidePanelSectionHeader | `ghost`, `mini`, `auto` | No (icon only) |
| `'footer'`  | Below toggle buttons   | `outline`, `sm`, `full` | Yes            |

| Button        | Action                              | Disabled When  |
| ------------- | ----------------------------------- | -------------- |
| Clear Sorting | `setColumnSorting(undefined)`       | No sorting set |
| Reset Sorting | `resetColumnSorting()` (from table) | Never          |

## Props

Takes no props (`Record<string, never>`). All state is read from `ColumnDrawerContext`.
