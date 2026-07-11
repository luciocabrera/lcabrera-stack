# VirtualListBody Architecture

Virtualized options body extracted from `VirtualList` to own list-specific orchestration and rendering.

## Responsibilities

- Derive `filteredOptions` from `dataState.data`, `searchTerm`, `listFilterMode`, and `selectedValues`
- Compute and handle select-all / option toggle selection changes
- Manage virtualization (`useVirtualization`) and infinite-scroll triggering (`useInfiniteScrollObserver` on a sentinel element, calling `onFetchMore`)
- Trigger optional initial fetch (`onFetchInitial`) on mount
- Delegate content rendering to `VirtualListBodyChildren`, which dispatches by `contentMode`: loading placeholders (`SkeletonOptions`), empty-state message (`InfoBox`, owns the `noResults` style), or the virtualized scroll area (`VirtualListBodyOptions`)
- `VirtualListBodyOptions` owns the virtual scroll area layout (`virtualScrollArea` / `virtualOffset` styles), key generation logic, and `VirtualizedOption` dispatch

## Props

| Prop               | Type                                 | Description                                        |
| ------------------ | ------------------------------------ | -------------------------------------------------- |
| `dataState`        | `VirtualListDataState`               | Source options and loading/hasMore state           |
| `selectedValues`   | `readonly string[]`                  | Controlled selected values                         |
| `listFilterMode`   | `ListFilterMode`                     | Active footer mode (`all`/`selected`/`unselected`) |
| `searchTerm`       | `string`                             | Header-controlled search term                      |
| `onChange`         | `VirtualListProps['onChange']`       | Selection update callback to parent                |
| `onFetchInitial`   | `VirtualListProps['onFetchInitial']` | Optional initial fetch callback                    |
| `onFetchMore`      | `VirtualListProps['onFetchMore']`    | Optional infinite-scroll callback                  |
| `hasCheckboxes`    | `boolean`                            | Toggles per-row checkbox mode                      |
| `hasSelectAll`     | `boolean`                            | Enables select-all row when filtered options > 1   |
| `listMaxHeight`    | `string`                             | Max-height for non-fill mode                       |
| `shouldFillHeight` | `boolean`                            | Uses fill-height container variant                 |

## Sub-components

| Component                 | Location                     | Responsibility                                                                            |
| ------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `VirtualListBodyChildren` | `./VirtualListBodyChildren/` | Content dispatch by `contentMode`: loading skeleton, empty-state message, or options list |
| `VirtualListBodyOptions`  | `./VirtualListBodyOptions/`  | Virtual scroll area layout, key generation, and `VirtualizedOption` row dispatch          |
