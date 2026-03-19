# PinningSection Architecture

Pin left/right toggle with clear/reset toolbar.

## File Structure

```
PinningSection/
├── index.ts                        → Barrel export
├── PinningSection.component.tsx    → Pin left/right toggle buttons
├── PinningSection.types.ts         → Props: { columnKey }
├── PinningSection.stylex.ts        → Delegates to drawerSectionStyles.list
│
└── PinningSectionToolbar/
    ├── index.ts                    → Barrel export
    ├── PinningSectionToolbar.component.tsx → Clear/reset pinning buttons
    ├── PinningSectionToolbar.types.ts     → { variant?: 'footer' | 'toolbar' }
    └── PinningSectionToolbar.stylex.ts    → Delegates to drawerSectionStyles
```

## Dependencies

```mermaid
graph LR
  PS["PinningSection"] --> SidePanelSection
  PS --> SidePanelSectionHeader
  PS --> SidePanelSectionMain
  PS --> Button
  PS --> Icons["PinLeftIcon, PinRightIcon"]
  PS --> PSToolbar["PinningSectionToolbar"]

  PS --> useGetColumnPinning["useGetColumnPinning (selector)"]
  PS --> useSetColumnPinning["useSetColumnPinning (action)"]

  PSToolbar --> Button2["Button"]
  PSToolbar --> Icons2["EraserIcon, RefreshIcon"]
  PSToolbar --> useResetColumnPinning["useResetColumnPinning (action)"]

  PS_stylex["PinningSection.stylex"] --> drawerSectionStyles
  PST_stylex["PinningSectionToolbar.stylex"] --> drawerSectionStyles
```

## Render Flow

```mermaid
graph TD
  A["PinningSection receives columnKey"] --> B["useGetColumnPinning → current side"]
  B --> C["SidePanelSectionMain"]
  C --> D["SidePanelSectionHeader + PinningSectionToolbar variant='toolbar'"]
  C --> E["Pin Left button"]
  C --> F["Pin Right button"]
  C --> G["PinningSectionToolbar variant='footer'"]

  E --> H{"Click Pin Left"}
  H -->|"Already 'left'"| I["setColumnPinning(undefined)"]
  H -->|"Not 'left'"| J["setColumnPinning('left')"]

  F --> K{"Click Pin Right"}
  K -->|"Already 'right'"| L["setColumnPinning(undefined)"]
  K -->|"Not 'right'"| M["setColumnPinning('right')"]
```

## Toolbar Dual-Variant Pattern

| Variant     | Placement              | Button Style            | Labels?        |
| ----------- | ---------------------- | ----------------------- | -------------- |
| `'toolbar'` | SidePanelSectionHeader | `ghost`, `mini`, `auto` | No (icon only) |
| `'footer'`  | Below toggle buttons   | `outline`, `sm`, `full` | Yes            |

| Button        | Action                              | Disabled When  |
| ------------- | ----------------------------------- | -------------- |
| Clear Pinning | `setColumnPinning(undefined)`       | No pinning set |
| Reset Pinning | `resetColumnPinning()` (from table) | Never          |

## Props

| Prop        | Type             | Description                                                        |
| ----------- | ---------------- | ------------------------------------------------------------------ |
| `columnKey` | `DataKey<TData>` | Column identifier (received but unused — state comes from context) |
