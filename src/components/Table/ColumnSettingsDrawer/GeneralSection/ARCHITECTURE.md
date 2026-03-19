# GeneralSection Architecture

Column width presets and global clear/reset controls for all drawer settings.

## File Structure

```
GeneralSection/
├── index.ts                       → Barrel export
├── GeneralSection.component.tsx   → Width presets + clear/reset all
├── GeneralSection.types.ts        → Props + WidthPreset type
└── GeneralSection.stylex.ts       → Delegates to drawerSectionStyles.list
```

## Dependencies

```mermaid
graph LR
  GS["GeneralSection"] --> SidePanelSection
  GS --> SidePanelSectionHeader
  GS --> SidePanelSectionMain
  GS --> Button
  GS --> InfoBox
  GS --> Icons["MinimizeIcon, MaximizeIcon, RefreshIcon, EraserIcon"]

  GS --> useGetNormalizedColumn["useGetNormalizedColumn (TableConfig selector)"]
  GS --> setColumnSizing["useSetColumnSizing (action)"]
  GS --> clearAll["useClearAllColumnDrawerSettings (action)"]
  GS --> resetAll["useResetAllColumnDrawerSettings (action)"]

  GS_stylex["GeneralSection.stylex"] --> drawerSectionStyles
```

## Render Flow

```mermaid
graph TD
  A["Receive columnKey prop"] --> B["useGetNormalizedColumn → column config"]
  B --> C["Extract minWidth, maxWidth from column"]
  C --> D["Render Column Width section"]
  D --> E["3 toggle buttons: Min / Max / Default"]
  E --> F{"Button clicked?"}
  F -->|"Same preset"| G["Deselect (do nothing)"]
  F -->|"Different preset"| H["setColumnSizing(value)"]
  D --> I["Render All Settings section"]
  I --> J["Clear All Settings → useClearAllColumnDrawerSettings"]
  I --> K["Reset All Settings → useResetAllColumnDrawerSettings"]
```

## Props

| Prop        | Type             | Description       |
| ----------- | ---------------- | ----------------- |
| `columnKey` | `DataKey<TData>` | Column identifier |

## Local State

| State            | Type                                                       | Purpose                                              |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| `selectedPreset` | `WidthPreset` (`'min' \| 'max' \| 'default' \| undefined`) | Track which width button is active (toggle behavior) |

## Sections Rendered

| Section      | Header         | Controls                                 |
| ------------ | -------------- | ---------------------------------------- |
| Column Width | "Column Width" | Set to Min, Set to Max, Reset to Default |
| _(InfoBox)_  | —              | Explanatory text                         |
| All Settings | "All Settings" | Clear All Settings, Reset All Settings   |
