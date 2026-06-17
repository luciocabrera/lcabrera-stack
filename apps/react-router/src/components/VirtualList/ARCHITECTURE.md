# VirtualList Architecture

Virtualized, searchable, multi-select list with infinite scroll, skeleton loading, and filter-mode toolbar.

## File Structure

```
VirtualList/
├── index.ts                         → Barrel export (VirtualList, VirtualListDataState, VirtualListProps)
├── VirtualList.component.tsx        → Orchestrator: shared UI state (search, filter-mode) and child composition
├── VirtualList.types.ts             → VirtualListProps, VirtualListDataState, ListFilterMode
├── VirtualList.constants.ts         → ITEM_HEIGHT, LIST_MAX_HEIGHT, DEFAULT_CONTAINER_HEIGHT, SCROLL_THRESHOLD
├── VirtualList.stylex.ts            → Shared option-row/container styles used by SelectAllOption, SelectOption and root container
│
├── VirtualListHeader/               → Search input and clear button
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualListHeader.component.tsx
│   ├── VirtualListHeader.stylex.ts
│   ├── VirtualListHeader.test.tsx
│   └── VirtualListHeader.types.ts
│
├── VirtualListBody/                 → List orchestration: filtering, selection callbacks, virtualization, scrolling
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualListBody.component.tsx
│   ├── VirtualListBody.stylex.ts
│   ├── VirtualListBody.test.tsx
│   └── VirtualListBody.types.ts
│
├── SelectAllOption/                 → "Select All / Deselect All" checkbox row
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── SelectAllOption.component.tsx
│   └── SelectAllOption.types.ts
│
├── SelectOption/                    → Single option row with optional checkbox
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── SelectOption.component.tsx
│   └── SelectOption.types.ts
│
├── SkeletonOptions/                 → Shimmer placeholder rows during initial load
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── SkeletonOptions.component.tsx
│   ├── SkeletonOptions.stylex.ts
│   └── SkeletonOptions.types.ts
│
├── VirtualListFooter/               → Status bar: loaded count + filter-mode buttons
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualListFooter.component.tsx
│   ├── VirtualListFooter.stylex.ts
│   └── VirtualListFooter.types.ts
│
├── VirtualizedOption/               → Per-row dispatcher (SelectAllOption or SelectOption)
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── VirtualizedOption.component.tsx
│   └── VirtualizedOption.types.ts
│
└── utils/
    ├── ARCHITECTURE.md
    ├── index.ts
    └── getFilteredOptions.util.ts   → Search + filter-mode filtering
```

## Component Hierarchy

```mermaid
graph TD
  VL["VirtualList"] --> SKO["SkeletonOptions (initial load)"]
  VL --> VLH["VirtualListHeader"]
  VL --> VLB["VirtualListBody"]
  VLB --> VO["VirtualizedOption × N (virtual window)"]
  VLB --> SKO["SkeletonOptions (initial load)"]
  VL --> VLF["VirtualListFooter"]
  VO --> SAO["SelectAllOption (index 0)"]
  VO --> SO["SelectOption (index 1…n)"]
```

## Dependencies

```mermaid
graph LR
  VL["VirtualList"] --> Button
  VL --> MenuCloseIcon
  VL --> useVirtualization["useVirtualization (hook)"]
  VL --> getFilteredOptions["utils/getFilteredOptions"]
  VL --> VLH["VirtualListHeader"]
  VL --> VLB["VirtualListBody"]
  VL --> VLF["VirtualListFooter"]

  VLH --> Button
  VLH --> MenuCloseIcon

  VLB --> InfoBox
  VLB --> SKO["SkeletonOptions"]
  VLB --> VO["VirtualizedOption"]

  VLF --> Button2["Button"]
  VLF --> Icons["ListAllIcon, ListCheckedIcon, ListUncheckedIcon"]

  SAO["SelectAllOption"] --> VL_stylex["VirtualList.stylex"]
  SO["SelectOption"] --> VL_stylex
```

## Data Flow

```mermaid
graph TD
  Parent["Parent component"] -->|"dataState, filter, onChange, onFetchInitial, onFetchMore"| VL["VirtualList"]

  VL -->|"searchTerm (local state)"| FO["getFilteredOptions()"]
  VL -->|"listFilterMode (local state)"| FO
  VL -->|"filter.values (prop)"| FO
  FO --> Visible["filteredOptions[]"]

  VL --> VLH["VirtualListHeader"]

  Visible --> UV["useVirtualization → startIndex, endIndex, offsetY, totalHeight"]
  UV --> VLB["VirtualListBody"]
  Visible --> VLB

  VLB --> VO["VirtualizedOption × (endIndex - startIndex)"]

  VO -->|"index === 0 && hasSelectAll"| SAO["SelectAllOption"]
  VO -->|"index > 0"| SO["SelectOption"]

  SO -->|"onChange (onToggle)"| VL
  SAO -->|"onChange (onSelectAll)"| VL
  VL -->|"onChange(SelectFilter)"| Parent
```

## Virtualization Strategy

`useVirtualization` measures the scroll container and computes which rows are inside the visible window. `VirtualList` renders only `endIndex - startIndex` `VirtualizedOption` elements and translates them via a CSS `translateY` to the correct scroll position.

The outer options list is explicitly sized with `border-box`, `width: 100%`,
`max-width: 100%`, and `min-width: 0` so embedded lists stay inside constrained
parents such as drawer filter cards.

| Constant                   | Value       | Role                                             |
| -------------------------- | ----------- | ------------------------------------------------ |
| `ITEM_HEIGHT`              | `32 px`     | Fixed row height (enables O(1) offset math)      |
| `LIST_MAX_HEIGHT`          | `18.75 rem` | Default `max-height` of the scroll container     |
| `DEFAULT_CONTAINER_HEIGHT` | `300 px`    | Fallback before the ref is measured              |
| `SCROLL_THRESHOLD`         | `50 px`     | Distance from bottom that triggers `onFetchMore` |

## Infinite Scroll

```mermaid
graph TD
  Scroll["scroll event"] --> Check{"scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD?"}
  Check -->|yes| HasMore{"hasMore && !isLoadingMore?"}
  HasMore -->|yes| Fetch["onFetchMore()"]
  HasMore -->|no| Skip["(no-op)"]
  Check -->|no| Skip2["(no-op)"]
```

## Filter Modes

| Mode           | Visible options                     |
| -------------- | ----------------------------------- |
| `'all'`        | All loaded options (post-search)    |
| `'selected'`   | Only options in `filter.values`     |
| `'unselected'` | Only options NOT in `filter.values` |

## Props

| Prop               | Type                              | Default      | Description                                      |
| ------------------ | --------------------------------- | ------------ | ------------------------------------------------ |
| `dataState`        | `VirtualListDataState`            | —            | Loading flags, data array, optional totalCount   |
| `filter`           | `SelectFilter`                    | —            | Controlled selected values (`filter.values`)     |
| `hasCheckboxes`    | `boolean`                         | `true`       | Show checkboxes next to options                  |
| `hasSelectAll`     | `boolean`                         | `true`       | Show "Select All" row when >1 option exists      |
| `listMaxHeight`    | `string`                          | `'18.75rem'` | CSS max-height of the scrollable list            |
| `name`             | `string`                          | —            | `name` attribute on the search input             |
| `onChange`         | `(filter?: SelectFilter) => void` | —            | Called on every selection change                 |
| `onFetchInitial`   | `() => Promise<void> \| void`     | —            | Fetches data on mount                            |
| `onFetchMore`      | `() => Promise<void> \| void`     | —            | Fetches next page when near bottom               |
| `shouldFillHeight` | `boolean`                         | `false`      | Expand list to fill all available vertical space |
