# utils/ Architecture

Pure filtering utility for the VirtualList component.

## File Structure

```
utils/
├── index.ts                      → Barrel export
└── getFilteredOptions.util.ts    → Apply search term + filter mode to options array
```

## Dependencies

```mermaid
graph LR
  GFO["getFilteredOptions()"] --> VL_types["VirtualList.types (ListFilterMode)"]
```

## Logic Flow

```mermaid
graph TD
  A["getFilteredOptions({ options, searchTerm, listFilterMode, selectedValues })"]
  A --> B{"searchTerm?"}
  B -->|yes| C["filter: option.toLowerCase().includes(term)"]
  B -->|no| D["keep all"]
  C & D --> E{"listFilterMode"}
  E -->|'selected'| F["filter: selectedValues.includes(option)"]
  E -->|'unselected'| G["filter: !selectedValues.includes(option)"]
  E -->|'all'| H["no further filter"]
  F & G & H --> I["return filtered string[]"]
```

## Function Reference

| Function             | Input                    | Output     | Purpose                                    |
| -------------------- | ------------------------ | ---------- | ------------------------------------------ |
| `getFilteredOptions` | `GetFilteredOptionsArgs` | `string[]` | Apply search + view-mode filter to options |

### `GetFilteredOptionsArgs`

| Field            | Type             | Description                                           |
| ---------------- | ---------------- | ----------------------------------------------------- |
| `listFilterMode` | `ListFilterMode` | `'all' \| 'selected' \| 'unselected'`                 |
| `options`        | `string[]`       | Raw options from `dataState.data`                     |
| `searchTerm`     | `string`         | Current value of the search input                     |
| `selectedValues` | `string[]`       | Currently selected option values from `filter.values` |

## Notes

- Search is **case-insensitive** substring match.
- Filter modes are applied **after** the search step (search narrows the pool first).
