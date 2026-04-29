# VirtualSelectTrigger Architecture

Combobox trigger: shows placeholder, single-value label, or multi-select tag chips with overflow counter and a chevron indicator.

## File Structure

```
VirtualSelectTrigger/
├── index.ts                              → Barrel export
├── VirtualSelectTrigger.component.tsx   → Trigger element (button when safe, div for tag mode)
├── VirtualSelectTrigger.stylex.ts       → Styles + TRIGGER_MAX_HEIGHT constant
└── VirtualSelectTrigger.types.ts        → Props
```

## Dependencies

```mermaid
graph LR
  VST["VirtualSelectTrigger"] --> Tag["Tag component"]
  VST --> VST_stylex["VirtualSelectTrigger.stylex (TRIGGER_MAX_HEIGHT)"]
  VST_stylex --> base_tokens["design-system/tokens/base.stylex"]
  VST_stylex --> colors["design-system/tokens/colors.stylex"]
```

## Render Flow

```mermaid
graph TD
  A["VirtualSelectTrigger renders"] --> B{"hasSelection?"}
  B -->|no| C["span.triggerPlaceholder → placeholder text"]
  B -->|yes| D{"mode === 'single'?"}
  D -->|yes| E["span.triggerLabel → selected[0]"]
  D -->|no (multi)| F["visibleTags.map → Tag chips"]
  F --> G{"overflowCount > 0?"}
  G -->|yes| H["span.overflowTag → '+N more'"]
  G -->|no| I["(nothing extra)"]
  A --> J{"!isAlwaysOpen?"}
  J -->|yes| K["span.chevron (↑ open / ↓ closed)"]
  J -->|no| L["(no chevron)"]
```

## Props

| Prop            | Type                                                     | Description                                                |
| --------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| `isAlwaysOpen`  | `boolean`                                                | Hides chevron and disables click/focus interaction         |
| `isOpen`        | `boolean`                                                | Controls chevron direction and `aria-expanded`             |
| `mode`          | `'single' \| 'multi'`                                    | Single shows label; multi shows Tag chips                  |
| `onRemoveTag`   | `(option: string) => void`                               | Called when a Tag's remove button is clicked               |
| `onToggle`      | `() => void`                                             | Opens/closes the dropdown                                  |
| `overflowCount` | `number`                                                 | Number of tags hidden behind "+N more"                     |
| `placeholder`   | `string`                                                 | Shown when `selected` is empty                             |
| `selected`      | `string[]`                                               | Full selection (used to detect `hasSelection`)             |
| `triggerRef`    | `RefObject<HTMLButtonElement \| HTMLDivElement \| null>` | Measured by ResizeObserver in `VirtualSelect`              |
| `visibleTags`   | `string[]`                                               | Subset of `selected` that fits within `TRIGGER_MAX_HEIGHT` |

## Tag Overflow Behaviour

| Constant             | Value | Role                                           |
| -------------------- | ----- | ---------------------------------------------- |
| `TRIGGER_MAX_HEIGHT` | 88 px | Max pixel height before tags start overflowing |

When `mode === 'multi'` the parent `VirtualSelect` attaches a `ResizeObserver` to `triggerRef` and calls `countVisibleTags` to compute `visibleTags` and `overflowCount` on every resize.

The trigger uses explicit `border-box`, `min-width: 0`, and `max-width: 100%`
sizing so padding and borders do not push the select beyond its parent.

## Accessibility

| Attribute       | Value / Logic                                                              |
| --------------- | -------------------------------------------------------------------------- |
| Native element  | `button` for single/placeholder trigger; `div` for multi-selected tag mode |
| `aria-expanded` | `isOpen` on interactive branches                                           |
| `aria-haspopup` | `listbox` on interactive branches                                          |
| Keyboard        | Native button keyboard handling; `Enter`/`Space` handled on div tag branch |
