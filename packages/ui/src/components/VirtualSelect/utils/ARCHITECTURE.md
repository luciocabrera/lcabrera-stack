# utils/ Architecture

Pure utility functions for VirtualSelect: tag overflow measurement and option/selection resolution. Dropdown positioning (`getDropdownStyle`) lives with its owner in `../VirtualSelectDropdown/utils/`.

## File Structure

```
utils/
├── index.ts                             → Barrel export
├── countVisibleTags.util.ts             → DOM-measure how many tags fit in the trigger
├── buildFallbackDataState.util.ts       → Wrap static options in a synthetic VirtualListDataState
├── toOptionEntry.util.ts                → Normalize string | {label,value} into an option entry
├── resolveVirtualSelectOptions.util.ts  → Option entries + label↔value mapping + selected labels
├── resolveTagOverflow.util.ts           → Split selected labels into visibleTags + overflowCount
├── resolveVirtualSelectChange.util.ts   → Map a VirtualList SelectFilter to the next selection
└── resolveSingleModeChange.util.ts      → Pick the newly added value in single mode
```

## Dependencies

```mermaid
graph LR
  CVT["countVisibleTags()"] --> TRIGGER_MAX_HEIGHT["VirtualSelectTrigger (TRIGGER_MAX_HEIGHT = 88px)"]
  RVSO["resolveVirtualSelectOptions()"] --> TOE["toOptionEntry()"]
  RVSC["resolveVirtualSelectChange()"] --> RSMC["resolveSingleModeChange()"]
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

| Field        | Type          | Description                                      |
| ------------ | ------------- | ------------------------------------------------ |
| `totalCount` | `number`      | Total selected items (full `selected.length`)    |
| `trigger`    | `HTMLElement` | The trigger DOM node (from `triggerRef.current`) |

### Overflow Slot Rule

When some tags overflow, one visible slot is reserved for the `"+N more"` badge — but at least **1** real tag is always shown.

## Resolution Utilities

| Util                          | Consumed by           | Role                                                                                     |
| ----------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `resolveVirtualSelectOptions` | `VirtualSelect`       | Normalizes options, builds `getLabelFromValue`/`getValueFromLabel`, maps selected labels |
| `buildFallbackDataState`      | `VirtualSelect`       | Wraps static option labels in a synthetic non-loading `VirtualListDataState`             |
| `resolveVirtualSelectChange`  | `VirtualSelect`       | Maps a `SelectFilter` to `{ nextSelected, shouldCloseDropdown }` per mode                |
| `resolveTagOverflow`          | `VirtualSelectHeader` | Splits the store-read selected labels into `visibleTags` + `overflowCount`               |
| `resolveSingleModeChange`     | (internal)            | Picks the newly added value in single mode                                               |
| `toOptionEntry`               | (internal)            | Normalizes `string \| { label, value }` options                                          |
