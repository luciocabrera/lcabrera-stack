# utils/ Architecture

Pure utility functions for VirtualSelect: tag overflow measurement and dropdown positioning.

## File Structure

```
utils/
├── index.ts                       → Barrel export
├── countVisibleTags.util.ts       → DOM-measure how many tags fit in the trigger
└── getDropdownStyle.util.ts       → Select the correct dropdown position style
```

## Dependencies

```mermaid
graph LR
  CVT["countVisibleTags()"] --> TRIGGER_MAX_HEIGHT["VirtualSelectTrigger (TRIGGER_MAX_HEIGHT = 88px)"]
  GDS["getDropdownStyle()"] --> VL_stylex["VirtualSelect.stylex (dropdownAbsolute, dropdownStatic, dropdownStaticFill)"]
```

## `countVisibleTags`

### Logic Flow

```mermaid
graph TD
  A["countVisibleTags({ totalCount, trigger })"]
  A --> B["filter children: exclude [data-chevron] and [data-overflow]"]
  B --> C["iterate tag elements"]
  C --> D{"offsetTop + offsetHeight <= TRIGGER_MAX_HEIGHT?"}
  D -->|yes| E["fittingCount++"]
  D -->|no| F["break"]
  E --> C
  F --> G["overflow = totalCount - fittingCount"]
  G --> H{"overflow > 0?"}
  H -->|yes| I["return max(1, fittingCount - 1)  ← reserve slot for '+N more'"]
  H -->|no| J["return fittingCount"]
```

### Args

| Field        | Type             | Description                                      |
| ------------ | ---------------- | ------------------------------------------------ |
| `totalCount` | `number`         | Total selected items (full `selected.length`)    |
| `trigger`    | `HTMLDivElement` | The trigger DOM node (from `triggerRef.current`) |

### Overflow Slot Rule

When some tags overflow, one visible slot is reserved for the `"+N more"` badge — but at least **1** real tag is always shown.

## `getDropdownStyle`

### Logic

```mermaid
graph TD
  A["getDropdownStyle(isAlwaysOpen, shouldFillHeight)"]
  A --> B{"isAlwaysOpen?"}
  B -->|no| C["dropdownAbsolute (positioned below trigger, z-index elevated)"]
  B -->|yes| D{"shouldFillHeight?"}
  D -->|yes| E["dropdownStaticFill (flex: 1, relative)"]
  D -->|no| F["dropdownStatic (position: relative)"]
```

| Input                           | Output style         | Use case                           |
| ------------------------------- | -------------------- | ---------------------------------- |
| `isAlwaysOpen=false`            | `dropdownAbsolute`   | Normal dropdown (overlays content) |
| `isAlwaysOpen=true, fill=false` | `dropdownStatic`     | Inline / embedded list             |
| `isAlwaysOpen=true, fill=true`  | `dropdownStaticFill` | Fill-height panel (e.g. drawer)    |
