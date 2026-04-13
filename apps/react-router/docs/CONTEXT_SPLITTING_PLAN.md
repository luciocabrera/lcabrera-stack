# Context Splitting Implementation Plan

## Current Architecture

```
TableContext (single context)
├── tableStore: TStore<TableState>
│   ├── columnFilters
│   ├── columnOrder
│   ├── columnPinning
│   ├── columnSizing
│   ├── columnVisibility
│   ├── data
│   ├── pagination
│   ├── rowSelection
│   └── sorting
└── metaStore: TStore<TableMeta>
    ├── error
    ├── hasMore
    ├── isLoading
    ├── isLoadingMore
    ├── paginationMeta
    └── totalRows
```

### Problem

When ANY state changes, ALL components using `useTableStore` or `useMetaStore` get notified, even if they only care about a specific slice of state.

While `useSyncExternalStore` with selectors helps, the store still notifies ALL subscribers, and React re-runs the selector function for each.

## Proposed Architecture: Split Contexts

Split into **5 focused contexts** based on how state is consumed:

```
TableDataContext       → Read-only data (rows)
TableFiltersContext    → Filter state (read + write)
TableSortingContext    → Sorting state (read + write)
TableColumnsContext    → Column config (order, sizing, visibility, pinning)
TableMetaContext       → Loading states, pagination meta
```

### Benefits

1. **Granular subscriptions** - Filter changes don't notify sorting consumers
2. **Better React Compiler optimization** - Smaller context = better memoization boundaries
3. **Clearer API** - Components declare exactly what they need
4. **SSR-friendly** - Each context can be hydrated independently

## Implementation

### Phase 1: Create New Context Files

#### 1.1 TableDataContext

```tsx
// TableDataContext.context.ts
import { createContext } from 'react';
import type { TStore } from '@/hooks';

export type TableDataState<TData> = {
  data: TData[];
};

export type TableDataContextValue<TData> = {
  dataStore: TStore<TableDataState<TData>>;
};

export const TableDataContext =
  createContext<TableDataContextValue<unknown> | null>(null);
```

#### 1.2 TableFiltersContext

```tsx
// TableFiltersContext.context.ts
import { createContext } from 'react';
import type { TStore } from '@/hooks';
import type { ColumnFiltersState } from '../Table.types';

export type TableFiltersState = {
  columnFilters: ColumnFiltersState;
};

export type TableFiltersActions = {
  clearColumnFilter: (columnKey: string) => void;
  setColumnFilter: (columnKey: string, filter: ColumnFilter) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
};

export type TableFiltersContextValue = {
  actions: TableFiltersActions;
  filtersStore: TStore<TableFiltersState>;
};

export const TableFiltersContext =
  createContext<TableFiltersContextValue | null>(null);
```

#### 1.3 TableSortingContext

```tsx
// TableSortingContext.context.ts
import { createContext } from 'react';
import type { TStore } from '@/hooks';
import type { SortingState } from '../Table.types';

export type TableSortingState = {
  sorting: SortingState;
};

export type TableSortingActions = {
  setSorting: (sorting: SortingState) => void;
  toggleSort: (params: { columnKey: string; isMultiSort: boolean }) => void;
};

export type TableSortingContextValue = {
  actions: TableSortingActions;
  sortingStore: TStore<TableSortingState>;
};

export const TableSortingContext =
  createContext<TableSortingContextValue | null>(null);
```

#### 1.4 TableColumnsContext

```tsx
// TableColumnsContext.context.ts
import { createContext } from 'react';
import type { TStore } from '@/hooks';
import type {
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  ColumnPinningState,
} from '../Table.types';

export type TableColumnsState = {
  columnOrder: ColumnOrderState;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
  columnVisibility: ColumnVisibilityState;
};

export type TableColumnsActions = {
  setColumnOrder: (order: ColumnOrderState) => void;
  setColumnPinning: (pinning: ColumnPinningState) => void;
  setColumnSizing: (sizing: ColumnSizingState) => void;
  setColumnVisibility: (visibility: ColumnVisibilityState) => void;
};

export type TableColumnsContextValue = {
  actions: TableColumnsActions;
  columnsStore: TStore<TableColumnsState>;
};

export const TableColumnsContext =
  createContext<TableColumnsContextValue | null>(null);
```

#### 1.5 TableMetaContext (keep existing, rename)

```tsx
// TableMetaContext.context.ts
import { createContext } from 'react';
import type { TStore } from '@/hooks';
import type { TableMeta } from '../Table.types';

export type TableMetaContextValue = {
  metaStore: TStore<TableMeta>;
};

export const TableMetaContext = createContext<TableMetaContextValue | null>(
  null,
);
```

### Phase 2: Create Combined Provider

```tsx
// TableProvider.tsx
export const TableProvider = <TData extends Record<string, unknown>>({
  children,
  initialColumnFilters,
  initialColumnOrder,
  initialColumnSizing,
  initialColumnVisibility,
  initialData = [],
  initialMeta,
  initialSorting,
  persistenceKey,
}: TableProviderProps<TData>) => {
  // Read persisted state from cookies
  const persistedState = persistenceKey
    ? readPersistedStateFromCookie({ persistenceKey })
    : {};

  // Create individual stores
  const dataStore = useStore<TableDataState<TData>>({
    data: initialData,
  });

  const filtersStore = useStore<TableFiltersState>({
    columnFilters: initialColumnFilters ?? persistedState.columnFilters ?? {},
  });

  const sortingStore = useStore<TableSortingState>({
    sorting: initialSorting ?? persistedState.sorting ?? [],
  });

  const columnsStore = useStore<TableColumnsState>({
    columnOrder: initialColumnOrder ?? persistedState.columnOrder ?? [],
    columnPinning: { left: [], right: [] },
    columnSizing: initialColumnSizing ?? persistedState.columnSizing ?? {},
    columnVisibility:
      initialColumnVisibility ?? persistedState.columnVisibility ?? new Set(),
  });

  const metaStore = useStore<TableMeta>({
    error: undefined,
    hasMore: false,
    isLoading: initialData.length === 0,
    isLoadingMore: false,
    paginationMeta: {},
    totalRows: initialData.length,
    ...initialMeta,
  });

  // Create stable action objects
  const filtersActions = useMemo<TableFiltersActions>(
    () => ({
      clearColumnFilter: (columnKey) => {
        const current = filtersStore.get()?.columnFilters ?? {};
        const { [columnKey]: _, ...rest } = current;
        filtersStore.set({ columnFilters: rest });
      },
      setColumnFilter: (columnKey, filter) => {
        const current = filtersStore.get()?.columnFilters ?? {};
        filtersStore.set({
          columnFilters: { ...current, [columnKey]: filter },
        });
      },
      setColumnFilters: (filters) => {
        filtersStore.set({ columnFilters: filters });
      },
    }),
    [filtersStore],
  );

  const sortingActions = useMemo<TableSortingActions>(
    () => ({
      setSorting: (sorting) => {
        sortingStore.set({ sorting });
      },
      toggleSort: ({ columnKey, isMultiSort }) => {
        const current = sortingStore.get()?.sorting ?? [];
        // ... toggle logic
      },
    }),
    [sortingStore],
  );

  const columnsActions = useMemo<TableColumnsActions>(
    () => ({
      setColumnOrder: (order) => columnsStore.set({ columnOrder: order }),
      setColumnPinning: (pinning) =>
        columnsStore.set({ columnPinning: pinning }),
      setColumnSizing: (sizing) => columnsStore.set({ columnSizing: sizing }),
      setColumnVisibility: (visibility) =>
        columnsStore.set({ columnVisibility: visibility }),
    }),
    [columnsStore],
  );

  return (
    <TableDataContext value={{ dataStore }}>
      <TableFiltersContext value={{ actions: filtersActions, filtersStore }}>
        <TableSortingContext value={{ actions: sortingActions, sortingStore }}>
          <TableColumnsContext
            value={{ actions: columnsActions, columnsStore }}
          >
            <TableMetaContext value={{ metaStore }}>
              {children}
            </TableMetaContext>
          </TableColumnsContext>
        </TableSortingContext>
      </TableFiltersContext>
    </TableDataContext>
  );
};
```

### Phase 3: Create Focused Hooks

```tsx
// hooks/useFilters.hook.ts
export const useColumnFilters = () => {
  const ctx = use(TableFiltersContext);
  if (!ctx)
    throw new Error('useColumnFilters must be used within TableProvider');

  return useSyncExternalStore(
    ctx.filtersStore.subscribe,
    () => ctx.filtersStore.get()?.columnFilters ?? {},
    () => ctx.filtersStore.getServerSnapshot()?.columnFilters ?? {},
  );
};

export const useSetColumnFilter = () => {
  const ctx = use(TableFiltersContext);
  if (!ctx)
    throw new Error('useSetColumnFilter must be used within TableProvider');
  return ctx.actions.setColumnFilter;
};

// hooks/useSorting.hook.ts
export const useSorting = () => {
  const ctx = use(TableSortingContext);
  if (!ctx) throw new Error('useSorting must be used within TableProvider');

  return useSyncExternalStore(
    ctx.sortingStore.subscribe,
    () => ctx.sortingStore.get()?.sorting ?? [],
    () => ctx.sortingStore.getServerSnapshot()?.sorting ?? [],
  );
};

// etc for other hooks...
```

### Phase 4: Migration Strategy

#### Step 1: Add new contexts alongside existing (non-breaking)

- Create new context files
- Export from index alongside existing hooks

#### Step 2: Create adapter hooks

```tsx
// Temporary adapters that use old context but expose new API
export const useColumnFiltersV2 = () => {
  // Uses old context internally
  const [filters] = useTableStore((s) => s.columnFilters);
  return filters;
};
```

#### Step 3: Migrate components one by one

- Start with leaf components (FilterPopover)
- Work up to parent components
- Run render tracker to verify improvements

#### Step 4: Remove old context

- Once all components migrated
- Remove TableContext and useTableStore

## Expected Results

### Before (Current)

```
FilterPopover render → triggers because ANY tableStore change
- columnFilters change: re-render ✓ (needed)
- sorting change: re-render ✗ (unnecessary)
- columnSizing change: re-render ✗ (unnecessary)
- data change: re-render ✗ (unnecessary)
```

### After (Split Contexts)

```
FilterPopover render → only triggers on filtersStore change
- columnFilters change: re-render ✓ (needed)
- sorting change: NO re-render ✓
- columnSizing change: NO re-render ✓
- data change: NO re-render ✓
```

## File Structure

```
src/components/Table/TableContext/
├── index.ts                        # Re-exports all
├── TableProvider.tsx               # Combined provider
├── contexts/
│   ├── TableDataContext.ts
│   ├── TableFiltersContext.ts
│   ├── TableSortingContext.ts
│   ├── TableColumnsContext.ts
│   └── TableMetaContext.ts
└── hooks/
    ├── useData.hook.ts
    ├── useFilters.hook.ts
    ├── useSorting.hook.ts
    ├── useColumns.hook.ts
    └── useMeta.hook.ts
```

## Timeline Estimate

| Phase     | Description              | Effort        |
| --------- | ------------------------ | ------------- |
| 1         | Create context files     | 2 hours       |
| 2         | Create combined provider | 3 hours       |
| 3         | Create focused hooks     | 2 hours       |
| 4         | Migrate components       | 4 hours       |
| 5         | Testing & cleanup        | 2 hours       |
| **Total** |                          | **~13 hours** |

## Notes

1. **React Compiler** will benefit from smaller contexts - less to track per component
2. **SSR** - Each store initializes independently, reducing hydration complexity
3. **DevTools** - Easier to debug which context caused a re-render
4. **Testing** - Can mock individual contexts in unit tests
