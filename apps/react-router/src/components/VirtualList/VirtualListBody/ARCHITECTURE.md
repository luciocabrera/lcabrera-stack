# VirtualListBody Architecture

Virtualized options body extracted from `VirtualList` to isolate rendering branches from orchestration logic.

## Responsibilities

- Render loading placeholders via `SkeletonOptions` during initial load
- Render empty-state message when filtered results are empty
- Render virtualized rows (`VirtualizedOption`) using `startIndex`, `endIndex`, `offsetY`, and `totalHeight`
- Preserve "Select All" index/key behavior from the original inline implementation

## Props

| Prop                  | Type                                | Description                                    |
| --------------------- | ----------------------------------- | ---------------------------------------------- |
| `filteredOptions`     | `readonly string[]`                 | Search/filter result options                   |
| `selectedValues`      | `readonly string[]`                 | Controlled selected values                     |
| `isInitialLoading`    | `boolean`                           | Shows skeleton rows                            |
| `isLoadingOptions`    | `boolean`                           | Disables row interactions                      |
| `isAllSelected`       | `boolean`                           | Controls select-all state                      |
| `hasCheckboxes`       | `boolean`                           | Toggles per-row checkbox mode                  |
| `shouldShowSelectAll` | `boolean`                           | Enables select-all row at index 0              |
| `shouldFillHeight`    | `boolean`                           | Uses fill-height container variant             |
| `listMaxHeight`       | `string`                            | Max-height for non-fill mode                   |
| `containerHeight`     | `number`                            | Drives skeleton row count                      |
| `startIndex`          | `number`                            | Virtual window start index                     |
| `endIndex`            | `number`                            | Virtual window end index                       |
| `offsetY`             | `number`                            | Pixel offset for rendered slice                |
| `totalHeight`         | `number`                            | Full virtual scroll area height                |
| `scrollContainerRef`  | `RefObject<HTMLDivElement \| null>` | Scroll container ref for measurement/scrolling |
| `onSelectAll`         | `() => void`                        | Select-all handler                             |
| `onToggle`            | `(option: string) => void`          | Single option toggle handler                   |
