# GeneralSettingsSection Architecture

Centralized control panel with column width presets and quick access to
clear/reset actions from all other sections (Filters, Sorting, Columns).

## File Structure

```
GeneralSettingsSection/
├── index.ts                                → Barrel export
├── GeneralSettingsSection.component.tsx     → Thin composition: width presets + section toolbars + all settings
├── GeneralSettingsSection.types.ts          → Props
├── GeneralSettingsSection.test.tsx          → Composition tests
│
├── ColumnWidthsSection/                     → Width preset toggles (owns preset state)
│   ├── ColumnWidthsSection.component.tsx
│   ├── ColumnWidthsSection.types.ts
│   ├── ColumnWidthsSection.stylex.ts
│   └── ColumnWidthsSection.test.tsx
│
├── AllSettingsSection/                      → Clear/reset-all buttons
│   ├── AllSettingsSection.component.tsx
│   ├── AllSettingsSection.types.ts
│   ├── AllSettingsSection.stylex.ts
│   └── AllSettingsSection.test.tsx
│
└── utils/
    ├── buildPresetColumnSizing.util.ts      → Pure preset → ColumnSizingState mapping
    └── buildPresetColumnSizing.util.test.ts
```

## Dependencies

```mermaid
graph LR
  GS["GeneralSettingsSection"] --> SidePanelSectionMain
  GS --> InfoBox
  GS --> CWS["ColumnWidthsSection"]
  GS --> ASS["AllSettingsSection"]
  GS --> FSToolbar["FiltersSectionToolbar (footer variant)"]
  GS --> SSToolbar["SortingSectionToolbar (footer variant)"]
  GS --> COSToolbar["ColumnOrderSectionToolbar (footer variant)"]

  CWS --> ColumnWidthPresetButtons
  CWS --> useGetColumns["useGetColumns (TableConfig)"]
  CWS --> useSetColumnsSizing["useSetColumnsSizing (action)"]
  CWS --> buildPresetColumnSizing["buildPresetColumnSizing (util)"]

  ASS --> ActionButtons
  ASS --> Icons["RefreshIcon, EraserIcon"]
  ASS --> useClearAllSettings["useClearAllSettings (action)"]
  ASS --> useResetTableSettings["useResetTableSettings (action)"]
```

## Render Flow

```mermaid
graph TD
  A["GeneralSettingsSection renders"] --> B["useGetColumns → column configs"]
  B --> C["Check minWidth/maxWidth availability"]

  C --> D["Section: Column Widths"]
  D --> E["Set All to Min Width (toggle)"]
  D --> F["Set All to Max Width (toggle)"]
  D --> G["Reset to Default Widths (toggle)"]
  E --> H{"Same preset?"}
  H -->|Yes| I["Deselect (do nothing)"]
  H -->|No| J["setColumnsSizing(computed values)"]

  C --> K["InfoBox: Explanatory text"]

  C --> L["Section: Filters"]
  L --> M["FiltersSectionToolbar (footer variant)"]

  C --> N["Section: Sorting"]
  N --> O["SortingSectionToolbar (footer variant)"]

  C --> P["Section: Columns"]
  P --> Q["ColumnOrderSectionToolbar (footer variant)"]

  C --> R["Section: All Settings"]
  R --> S["Clear All Settings → useClearAllSettings"]
  R --> T["Reset All Settings → useResetTableSettings"]
```

## Sections Rendered

| Section       | Header          | Controls                                           |
| ------------- | --------------- | -------------------------------------------------- |
| Column Widths | "Column Widths" | Set to Min, Set to Max, Reset to Default (toggles) |
| _(InfoBox)_   | —               | Explanatory text about presets                     |
| Filters       | "Filters"       | `FiltersSectionToolbar` (clear/reset filters)      |
| Sorting       | "Sorting"       | `SortingSectionToolbar` (sort/clear/reset sorting) |
| Columns       | "Columns"       | `ColumnOrderSectionToolbar` (order/clear/reset)    |
| All Settings  | "All Settings"  | Clear All Settings, Reset All Settings             |

## Local State

| State            | Owner                 | Type                                                       | Purpose                                              |
| ---------------- | --------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| `selectedPreset` | `ColumnWidthsSection` | `WidthPreset` (`'min' \| 'max' \| 'default' \| undefined`) | Track which width button is active (toggle behavior) |

## Cross-Section Toolbar Reuse

GeneralSettingsSection reuses toolbar components from other sections as footer variants:

```mermaid
graph LR
  GS["GeneralSettingsSection"] --> FST["FiltersSection/FiltersSectionToolbar"]
  GS --> SST["SortingSection/SortingSectionToolbar"]
  GS --> COST["ColumnOrderSection/ColumnOrderSectionToolbar"]
```

All three are rendered without a `variant` prop, defaulting to `'footer'` (full-width buttons with labels).
