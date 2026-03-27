# TableConfig Context Architecture

Central configuration context that manages **column settings** and **UI meta state**
through two independent stores. This is the primary source of truth for how
columns are displayed, filtered, sorted, pinned, and sized.

## File Structure

```
TableConfig/
├── TableConfigContext.context.ts            → createContext (undefined default)
├── TableConfigContext.provider.tsx           → Provider: creates both stores
├── TableConfigContext.types.ts              → ContextValue (columnsStore + metaStore)
├── useTableConfigContextValue.hook.ts       → use(TableConfigContext) with guard
├── index.ts                                 → Barrel: TableConfigProvider, hooks
│
├── columns/                                 → Column-related store, actions, selectors
│   ├── useColumnsStore.hook.ts              → useSyncExternalStore + selector
│   │
│   ├── actions/
│   │   ├── useAcceptHeaderPinConflict.hook.ts   → Resolve pin conflict from header
│   │   ├── useAcceptHeaderPinSide.hook.ts       → Accept pin side from header
│   │   ├── useBatchSetColumnSettings.hook.ts    → Bulk-update multiple column fields
│   │   ├── useBatchSetTableSettings.hook.ts     → Push settings from drawer → store
│   │   ├── useResetColumnFilter.hook.ts         → Clear filter for one column
│   │   ├── useSetColumnFilter.hook.ts           → Set filter for one column
│   │   ├── useSetColumnPinning.hook.ts          → Set pinning state
│   │   ├── useSetColumnSizing.hook.ts           → Set column widths
│   │   ├── useSetColumnSorting.hook.ts          → Set sorting state
│   │   └── useSyncColumnsSizing.hook.ts         → Sync sizing after layout changes
│   │
│   └── selectors/
│       ├── useGetColumnFilters.hook.ts          → All column filters
│       ├── useGetColumnGroups.hook.ts           → Pre-split column groups (derived)
│       ├── useGetColumnOrder.hook.ts            → Column order array
│       ├── useGetColumnPinning.hook.ts          → Pinning state { left, right }
│       ├── useGetColumnSizing.hook.ts           → Column width map
│       ├── useGetColumnVisibility.hook.ts       → Hidden columns set
│       ├── useGetColumns.hook.ts                → Raw column definitions
│       ├── useGetColumnsSorting.hook.ts         → Sorting state array
│       ├── useGetEffectiveColumns.hook.ts       → Columns with applied settings
│       ├── useGetNormalizedColumn.hook.ts       → Single normalized column by key
│       ├── useGetNormalizedColumnFilters.hook.ts → Filters with column metadata
│       ├── useGetNormalizedColumns.hook.ts      → All normalized columns
│       ├── useGetPinnedColumnOffsets.hook.ts    → Pre-computed pinned offsets (derived)
│       └── useGetStaticColumnKeys.hook.ts       → Non-reorderable column keys
│
├── meta/                                    → UI meta store, actions, selectors
│   ├── useMetaStore.hook.ts                 → useSyncExternalStore + selector
│   │
│   ├── actions/
│   │   ├── useSetTableColumnSelectedKey.hook.ts          → Track selected column
│   │   ├── useToogleTableIsColumnSettingsOpen.hook.ts    → Toggle column settings drawer
│   │   └── useToogleTableIsTableSettingsOpen.hook.ts     → Toggle table settings drawer
│   │
│   └── selectors/
│       ├── useGetTableColumnSelectedKey.hook.ts          → Selected column key
│       ├── useGetTableDensity.hook.ts                    → Table density setting
│       ├── useGetTableIsBordered.hook.ts                 → Border toggle
│       ├── useGetTableIsColumnSettingsOpen.hook.ts       → Column settings open state
│       ├── useGetTableIsStriped.hook.ts                  → Striped rows toggle
│       ├── useGetTableIsTableSettingsOpen.hook.ts        → Table settings open state
│       ├── useGetTableOverscan.hook.ts                   → Virtual scroll overscan
│       ├── useGetTablePlaceholderRowCount.hook.ts        → Placeholder row count
│       ├── useGetTableRowHeight.hook.ts                  → Row height value
│       ├── useGetTableThreshold.hook.ts                  → Fetch-more threshold
│       └── useGetTableTitle.hook.ts                      → Table title string
│
└── utils/
    ├── getInitialColumnsState.util.ts       → Build initial columns state from props
    ├── getInitialMetaState.util.ts          → Build initial meta state from props
    └── index.ts                             → Barrel: utils
```

## Dual-Store Pattern

```mermaid
graph LR
  subgraph "TableConfigContext"
    Provider["TableConfigProvider"]
    Provider -->|"getInitialColumnsState()"| CS["columnsStore (TStore)"]
    Provider -->|"getInitialMetaState()"| MS["metaStore (TStore)"]

    CS -->|"get / set / subscribe"| ColState["TableColumnsState"]
    MS -->|"get / set / subscribe"| MetState["TableMetaState"]
  end

  useColumnsStore["useColumnsStore(selector)"] -->|"useSyncExternalStore"| CS
  useMetaStore["useMetaStore(selector)"] -->|"useSyncExternalStore"| MS
```

Two stores are kept separate so column-heavy updates (filters, sorting, reorder)
do not trigger re-renders in components that only read meta state (density, title),
and vice versa.

## Columns State Shape

```typescript
TableColumnsState<TData> = {
  columns: ColumnDef<TData>[];           // Raw column definitions
  columnFilters: ColumnFilters;          // Record<string, ColumnFilter>
  columnGroups: ColumnGroupsState;       // Pre-split { leftPinnedCols, centerCols, rightPinnedCols }
  columnOrder: ColumnOrderState;         // string[]
  columnPinning: ColumnPinningState;     // { left: string[], right: string[] }
  columnSizing: ColumnSizingState;       // Record<string, number>
  columnVisibility: Set<string>;         // Hidden column keys
  sorting: SortingState[];               // Active sort entries
  effectiveColumns: EffectiveColumn[];   // Columns with applied settings
  normalizedColumns: NormalizedColumn[]; // Flat enriched column descriptors
  pinnedColumnOffsets: PinnedColumnOffsetsState; // Pre-computed sticky offsets
  staticKeys: Set<string>;              // Non-reorderable column keys
};
```

## Meta State Shape

```typescript
TableMetaState = {
  columnSelectedKey: string | null;  // Currently selected column key
  density: TableDensity;             // compact | normal | comfortable
  enablePrefetch: boolean;           // Prefetch next page after load-more (ADR-006)
  error: Error | null;               // Table-level error
  initialPageSize: number;           // First page row count
  isBordered: boolean;               // Show borders
  isColumnSettingsOpen: boolean;     // Column settings drawer open
  isStriped: boolean;                // Striped rows
  isTableSettingsOpen: boolean;      // Table settings drawer open
  loadMorePageSize: number;          // Subsequent page row count
  overscan: number;                  // Virtual scroll overscan count
  persistenceKey: string;            // Key for URL/cookie persistence
  placeholderRowCount: number;       // Skeleton row count while loading
  rowHeight: number;                 // Row height in px
  threshold: number;                 // Scroll threshold for fetch-more
  title: string;                     // Table display title
};
```

## Provider Initialization

```mermaid
graph TD
  A["TableConfigProvider receives columns + config props"]
  A --> B["getInitialColumnsState(columns, filters, order, pinning, sizing, visibility, sorting)"]
  A --> C["getInitialMetaState(density, bordered, striped, overscan, ...)"]
  B --> D["useStore(columnsInitial) → columnsStore"]
  C --> E["useStore(metaInitial) → metaStore"]
  D --> F["Provide { columnsStore, metaStore } via TableConfigContext"]
  E --> F
```

## Columns Actions

| Hook                         | Reads From     | Writes To      | Description                                 |
| ---------------------------- | -------------- | -------------- | ------------------------------------------- |
| `useBatchSetColumnSettings`  | —              | `columnsStore` | Bulk-set multiple column fields at once     |
| `useBatchSetTableSettings`   | —              | `columnsStore` | Push all settings from TableSettingsDrawer  |
| `useResetColumnFilter`       | —              | `columnsStore` | Remove filter for a single column           |
| `useSetColumnFilter`         | —              | `columnsStore` | Set filter value for a single column        |
| `useSetColumnPinning`        | `columnsStore` | `columnsStore` | Update pinning with conflict resolution     |
| `useSetColumnSizing`         | —              | `columnsStore` | Set column width map                        |
| `useSetColumnSorting`        | `columnsStore` | `columnsStore` | Toggle/set sort for a column                |
| `useSyncColumnsSizing`       | `columnsStore` | `columnsStore` | Recalculate sizing after layout shift       |
| `useAcceptHeaderPinConflict` | `columnsStore` | `columnsStore` | Resolve pin contiguity conflict from header |
| `useAcceptHeaderPinSide`     | `columnsStore` | `columnsStore` | Accept pin side choice from header          |

## Columns Selectors

| Hook                            | Returns                    | Description                           |
| ------------------------------- | -------------------------- | ------------------------------------- |
| `useGetColumns`                 | `ColumnDef[]`              | Raw column definitions                |
| `useGetColumnFilters`           | `ColumnFilters`            | All active column filters             |
| `useGetColumnOrder`             | `ColumnOrderState`         | Column order array                    |
| `useGetColumnPinning`           | `ColumnPinningState`       | Pinning state `{ left, right }`       |
| `useGetColumnSizing`            | `ColumnSizingState`        | Column width map                      |
| `useGetColumnVisibility`        | `Set<string>`              | Set of hidden column keys             |
| `useGetColumnsSorting`          | `SortingState[]`           | Active sorting entries                |
| `useGetEffectiveColumns`        | `EffectiveColumn[]`        | Columns with all settings applied     |
| `useGetNormalizedColumn`        | `NormalizedColumn`         | Single enriched column by key         |
| `useGetNormalizedColumns`       | `NormalizedColumn[]`       | All enriched column descriptors       |
| `useGetNormalizedColumnFilters` | `NormalizedFilter[]`       | Filters enriched with column metadata |
| `useGetColumnGroups`            | `ColumnGroupsState`        | Pre-split left/center/right columns   |
| `useGetPinnedColumnOffsets`     | `PinnedColumnOffsetsState` | Sticky offsets for pinned columns     |
| `useGetStaticColumnKeys`        | `Set<string>`              | Non-reorderable column keys           |

## Meta Actions

| Hook                                 | Writes To   | Description                   |
| ------------------------------------ | ----------- | ----------------------------- |
| `useSetTableColumnSelectedKey`       | `metaStore` | Set which column is selected  |
| `useToogleTableIsColumnSettingsOpen` | `metaStore` | Toggle column settings drawer |
| `useToogleTableIsTableSettingsOpen`  | `metaStore` | Toggle table settings drawer  |

## Meta Selectors

| Hook                              | Returns          | Description                       |
| --------------------------------- | ---------------- | --------------------------------- |
| `useGetTableColumnSelectedKey`    | `string \| null` | Currently selected column key     |
| `useGetTableDensity`              | `TableDensity`   | Table density setting             |
| `useGetTableEnablePrefetch`       | `boolean`        | Whether prefetch buffer is active |
| `useGetTableIsBordered`           | `boolean`        | Whether borders are shown         |
| `useGetTableIsColumnSettingsOpen` | `boolean`        | Column settings drawer state      |
| `useGetTableIsStriped`            | `boolean`        | Whether rows are striped          |
| `useGetTableIsTableSettingsOpen`  | `boolean`        | Table settings drawer state       |
| `useGetTableLoadMorePageSize`     | `number`         | Subsequent page row count         |
| `useGetTableOverscan`             | `number`         | Virtual scroll overscan count     |
| `useGetTablePlaceholderRowCount`  | `number`         | Skeleton row count                |
| `useGetTableRowHeight`            | `number`         | Row height in px                  |
| `useGetTableThreshold`            | `number`         | Fetch-more scroll threshold       |
| `useGetTableTitle`                | `string`         | Table display title               |
