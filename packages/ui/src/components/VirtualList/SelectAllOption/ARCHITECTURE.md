# SelectAllOption Architecture

Checkbox row that toggles all visible/filtered options at once, with shimmer overlay while loading.

## File Structure

```
SelectAllOption/
├── index.ts                          → Barrel export
├── SelectAllOption.component.tsx     → "Select All / Deselect All" checkbox label
└── SelectAllOption.types.ts          → { isAllSelected, isLoading, onSelectAll }
```

## Dependencies

```mermaid
graph LR
  SAO["SelectAllOption"] --> Checkbox["Checkbox"]
  SAO["SelectAllOption"] --> VL_stylex["VirtualList.stylex (styles, skeletonStyles)"]
```

## Render Flow

```mermaid
graph TD
  A["SelectAllOption renders"] --> B{"isAllSelected?"}
  B -->|true| C["Label: 'Deselect All'"]
  B -->|false| D["Label: 'Select All'"]
  A --> E["checkbox (checked=isAllSelected, disabled=isLoading)"]
  A --> F{"isLoading?"}
  F -->|true| G["shimmer loadingOverlay"]
  F -->|false| H["(nothing)"]
```

## Props

| Prop            | Type         | Description                                 |
| --------------- | ------------ | ------------------------------------------- |
| `isAllSelected` | `boolean`    | Whether every visible option is selected    |
| `isLoading`     | `boolean`    | Disables the checkbox and shows shimmer     |
| `onSelectAll`   | `() => void` | Fires `onChange`; parent decides add/remove |

## Notes

- Rendered by `VirtualizedOption` at `index === 0` when `hasSelectAll && filteredOptions.length > 1`.
- Uses shared `Checkbox` for checkbox visuals and behavior.
- Uses shared `styles` and `skeletonStyles` from `VirtualList.stylex` for row and shimmer styles.
