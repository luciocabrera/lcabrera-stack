# FilterSection Architecture

Column filter input with clear/reset toolbar. Delegates filtering UI to the
shared `FilterInputs` component from `Table/filters/`.

## File Structure

```
FilterSection/
├── index.ts                       → Barrel export
├── FilterSection.component.tsx    → Filter input + toolbar (header + footer)
├── FilterSection.types.ts         → Props: { columnKey }
├── FilterSection.stylex.ts        → Custom flex layout (not drawerSectionStyles)
│
└── FilterSectionToolbar/
    ├── index.ts                   → Barrel export
    ├── FilterSectionToolbar.component.tsx → Clear/reset filter buttons
    ├── FilterSectionToolbar.types.ts     → { variant?: 'footer' | 'toolbar' }
    └── FilterSectionToolbar.stylex.ts    → Delegates to drawerSectionStyles
```

## Dependencies

```mermaid
graph LR
  FS["FilterSection"] --> SidePanelSectionHeader
  FS --> SidePanelSectionMain
  FS --> FilterInputs["Table/filters/FilterInputs"]
  FS --> FSToolbar["FilterSectionToolbar"]

  FS --> useGetColumnFilter["useGetColumnFilter (selector)"]
  FS --> useSetColumnFilter["useSetColumnFilter (action)"]

  FSToolbar --> Button
  FSToolbar --> Icons["EraserIcon, RefreshIcon"]
  FSToolbar --> useResetColumnFilter["useResetColumnFilter (action)"]
  FSToolbar --> useGetColumnFilter2["useGetColumnFilter (selector)"]
  FSToolbar --> useSetColumnFilter2["useSetColumnFilter (action)"]

  FS_stylex["FilterSection.stylex"] --> base_stylex["base.stylex (spacing)"]
  FST_stylex["FilterSectionToolbar.stylex"] --> drawerSectionStyles
```

## Render Flow

```mermaid
graph TD
  A["Receive columnKey prop"] --> B["useGetColumnFilter → current filter"]
  B --> C["Render SidePanelSectionMain"]
  C --> D["SidePanelSectionHeader with toolbar variant"]
  D --> E["FilterSectionToolbar variant='toolbar' (icon-only)"]
  C --> F["FilterInputs: columnKey, filter, onChange"]
  C --> G["FilterSectionToolbar variant='footer' (full-width)"]
```

## Toolbar Dual-Variant Pattern

The `FilterSectionToolbar` renders in two locations with different visual styles:

```mermaid
graph LR
  subgraph "variant='toolbar'"
    T_color["ghost"] --- T_size["mini"] --- T_width["auto"]
    T_label["Icon only, no text"]
  end

  subgraph "variant='footer'"
    F_color["outline"] --- F_size["sm"] --- F_width["full"]
    F_label["Icon + label text"]
  end
```

| Button       | Action                             | Disabled When |
| ------------ | ---------------------------------- | ------------- |
| Clear Filter | `setColumnFilter(undefined)`       | No filter set |
| Reset Filter | `resetColumnFilter()` (from table) | Never         |

## Props

| Prop        | Type             | Description       |
| ----------- | ---------------- | ----------------- |
| `columnKey` | `DataKey<TData>` | Column identifier |
