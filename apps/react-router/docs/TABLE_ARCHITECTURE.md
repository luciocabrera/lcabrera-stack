# Table Component Architecture

## Overview

The Table component implements a scalable, performant data table with advanced features including sorting, filtering, virtualization, infinite scrolling, and state persistence. The architecture is built on a **store-based state management pattern** using React's `useSyncExternalStore` API with a clear separation between **actions** (state mutations) and **selectors** (state access).

## Core Principles

1. **Separation of Concerns**: Configuration vs Runtime Data
2. **Granular Subscriptions**: Components only re-render when their specific data slice changes
3. **Action/Selector Pattern**: Clear distinction between reading and writing state
4. **Type Safety**: Full TypeScript support with generics
5. **Performance**: Virtualization + shallow equality checks minimize unnecessary renders

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Table Component                          │
│  (Entry point, creates providers, passes initial data)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
┌─────────▼──────────────┐   ┌────────────▼────────────────┐
│ TableConfigProvider    │   │  TableDataProvider          │
│ (Configuration State)  │   │  (Runtime Data State)       │
│                        │   │                             │
│ • columnsStore         │   │ • dataStore                 │
│   - Column definitions │   │   - Table rows data         │
│   - Sorting state      │   │   - Loading states          │
│   - Filter state       │   │   - Pagination info         │
│   - Visibility state   │   │                             │
│   - Sizing state       │   │ • filtersDataStore          │
│   - Order state        │   │   - Filter dropdown data    │
│   - Pinning state      │   │   - Async filter options    │
│                        │   │   - Loading states          │
│ • metaStore            │   │                             │
│   - UI preferences     │   └─────────────────────────────┘
│   - Density, borders   │
│   - Persistence config │
└────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    UI Components Layer                       │
│  (TableHeader, TableBody, TableHeaderCell, etc.)            │
│                                                              │
│  Each component uses:                                       │
│  • Actions (mutations) - useSet*, useReset*, useFetch*      │
│  • Selectors (reads) - useGet*                              │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Architecture

### 1. Store Implementation (`useStore`)

The foundation is a custom store hook that wraps React's `useSyncExternalStore`:

**Location**: `src/hooks/useStore.hook.ts`

```typescript
export type TStore<TData> = {
  get: () => TData | undefined;
  getServerSnapshot: () => TData | undefined;
  reset: () => void;
  set: (value: Partial<TData>) => void; // Shallow merge
  subscribe: (callback: () => void) => () => void;
};
```

**Key Features**:

- **Shallow merge**: `set()` merges partial updates with current state
- **Shallow equality check**: Only notifies subscribers if state actually changed
- **SSR support**: `getServerSnapshot()` returns initial state for hydration
- **Efficient subscriptions**: Uses `Set` for O(1) add/remove operations

### 2. Context Providers

#### TableConfigProvider (Configuration State)

**Purpose**: Manages configuration that changes infrequently

**State Stores**:

1. **columnsStore** (`TableColumnsState<TData>`):
   - `columns`: Array of column definitions
   - `columnFilters`: Filter configurations per column
   - `columnOrder`: Display order of columns
   - `columnPinning`: Left/right pinned columns
   - `columnSizing`: Custom widths per column
   - `columnVisibility`: Which columns are visible (Set)
   - `sorting`: Multi-column sort state
   - `normalizedColumns`: Enriched columns with sort info
   - `effectiveColumns`: Columns after visibility/order filters

2. **metaStore** (`TableMetaState`):
   - UI preferences: `density`, `isBordered`, `isStriped`
   - Performance settings: `overscan`, `threshold`, `rowHeight`
   - Pagination: `initialPageSize`, `loadMorePageSize`
   - Persistence: `persistenceKey`
   - Localization: `locale`
   - Error handling: `error?`

#### TableDataProvider (Runtime Data)

**Purpose**: Manages data that changes frequently during runtime

**State Stores**:

1. **dataStore** (`TableDataState<TData>`):
   - `data`: Array of table rows
   - `totalRows`: Total count (for pagination)
   - `totalLoadedRows`: Currently loaded count
   - `hasMore`: Whether more data is available
   - `isLoading`: Initial load state
   - `isLoadingMore`: Infinite scroll load state

2. **filtersDataStore** (`FiltersDataState<TData>`):
   - Record mapping each column key to its filter dropdown data:
     ```typescript
     {
       [columnKey]: {
         data: string[];           // Filter option values
         totalRows: number;        // Total available options
         totalLoadedRows: number;  // Currently loaded options
         hasMore: boolean;         // More options available
         isLoading: boolean;       // Initial load
         isLoadingMore: boolean;   // Pagination load
       }
     }
     ```

**Initialization**:

- `getInitialDataState()`: Sets up data store with initial rows
- `getInitialFiltersDataState()`: Pre-creates filter data entries for ALL columns (prevents undefined access errors)

---

## Action/Selector Pattern

### Pattern Structure

Each store domain (columns, data, filters, meta) follows this structure:

```
store/
  ├── {domain}/
  │   ├── use{Domain}Store.hook.ts     # Base store hook
  │   ├── actions/                      # State mutations
  │   │   ├── useSetColumnFilter.hook.ts
  │   │   ├── useResetColumnFilter.hook.ts
  │   │   ├── useFetchMoreData.hook.ts
  │   │   └── index.ts                  # Barrel export
  │   └── selectors/                    # State reads
  │       ├── useGetColumnFilters.hook.ts
  │       ├── useGetColumns.hook.ts
  │       └── index.ts                  # Barrel export
```

### Base Store Hooks

Each domain has a base hook that wraps `useSyncExternalStore`:

**Example**: `useColumnsStore.hook.ts`

```typescript
export const useColumnsStore = <TSelected, TData = unknown>(
  selector: (state: TableColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableConfigContextValue();

  const state = useSyncExternalStore(
    columnsStore.subscribe,
    () => selector(columnsStore.get() as TableColumnsState<TData>),
    () =>
      selector(columnsStore.getServerSnapshot() as TableColumnsState<TData>),
  );

  return state;
};
```

**Key Benefits**:

- Components subscribe only to the specific state slice they need
- Automatic re-render when that slice changes
- SSR-safe with server snapshot

### Selectors (Read Operations)

**Purpose**: Read specific slices of state

**Characteristics**:

- Stateless functions that accept a selector
- Return computed or direct state values
- Enable granular subscriptions
- Minimal re-renders

**Examples**:

```typescript
// Simple selector - direct property access
export const useGetColumns = <TData>() =>
  useColumnsStore<TableColumn<TData>[]>((state) => state.columns);

// Computed selector - derived state
export const useGetColumnFilters = <TData>() =>
  useColumnsStore<ColumnFiltersState<TData>, TData>(
    (state) => state.columnFilters,
  );

// Single item selector
export const useGetFilterData = <TData>(columnKey: DataKey<TData>) =>
  useFiltersStore<FiltersDataState<TData>[DataKey<TData>], TData>(
    (state) => state[columnKey],
  );
```

### Actions (Write Operations)

**Purpose**: Mutate state through well-defined operations

**Characteristics**:

- Encapsulate business logic
- Handle side effects (persistence, URL updates, async operations)
- Return callbacks for use in event handlers
- Ensure consistent state updates

**Examples**:

#### 1. Simple Synchronous Action

```typescript
export const useSetColumnSorting = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return useCallback(
    ({ columnKey, direction }: SetColumnSortingArgs<TData>) => {
      const columnsState = columnsStore.get();

      // Business logic: update sorting array
      const newSorting = direction ? [{ key: columnKey, direction }] : [];

      // Persist to storage
      writeStateSlice({
        persistenceKey,
        slice: 'sorting',
        storageType: 'cookie',
        value: newSorting,
      });

      // Update store
      columnsStore.set({ sorting: newSorting });
    },
    [columnsStore],
  );
};
```

#### 2. Complex Async Action with Error Handling

```typescript
export const useFetchMoreData = <TData, TResponse>() => {
  const { dataStore } = useTableDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  return async ({ dataSelector, dataTotalSelector, onLoadMore }) => {
    const dataState = dataStore.get();
    const currentData = dataState?.data ?? [];

    try {
      // Set loading state
      dataStore.set({ isLoadingMore: true });

      // Fetch new data
      const response = await onLoadMore({
        limit: 50,
        skip: currentData.length,
      });

      // Process and merge
      const data = dataSelector(response);
      const combinedData = [...currentData, ...data];
      const totalRows = dataTotalSelector(response);

      // Update store with results
      dataStore.set({
        data: combinedData,
        hasMore: totalRows > combinedData.length,
        isLoadingMore: false,
        totalLoadedRows: combinedData.length,
        totalRows,
      });
    } catch (error) {
      // Handle error in meta store
      metaStore.set({
        error: error instanceof Error ? error.message : 'Failed to load data',
      });
      dataStore.set({ isLoadingMore: false });
    }
  };
};
```

#### 3. Filter-Specific Async Action

```typescript
export const useFetchMoreFilterData = <TData, TResponse>(columnKey: string) => {
  const { filtersDataStore } = useTableDataContextValue();

  return async ({ dataSelector, onLoadMore }) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilterData = filtersDataState?.[columnKey];

    if (!currentFilterData) {
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    const currentData = currentFilterData.data;

    try {
      // Set loading state for this specific column
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          isLoadingMore: true,
        },
      });

      const response = await onLoadMore({
        limit: 50,
        skip: currentData.length,
      });

      const data = dataSelector(response);
      const combinedData: string[] = [...currentData, ...data];

      // Update only this column's filter data
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          data: combinedData,
          hasMore: totalRows > combinedData.length,
          isLoadingMore: false,
          totalLoadedRows: combinedData.length,
        },
      });
    } catch (error) {
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          isLoadingMore: false,
        },
      });
    }
  };
};
```

---

## UI Component Integration

### Component Usage Pattern

Every UI component follows this pattern:

1. **Import actions and selectors at the top**
2. **Call selector hooks to subscribe to needed state**
3. **Call action hooks (outside render) to get mutation functions**
4. **Use mutation functions in event handlers**

**Example**: `TableHeaderCell.component.tsx`

```tsx
export const TableHeaderCell = <TData,>({ columnKey }: Props<TData>) => {
  // === SELECTORS (subscribe to state) ===
  const columnSizing = useGetColumnSizing();
  const column = useGetNormalizedColumn<TData>(columnKey);
  const isLoading = useGetTableIsLoading();

  // === ACTIONS (get mutation functions) ===
  const setColumnSizing = useSetColumnSizing();
  const setSorting = useSetColumnSorting();

  // === DERIVED VALUES ===
  const currentWidth = columnSizing[column.key] ?? minWidth;
  const sortDirection = column.sortDirection;

  // === EVENT HANDLERS ===
  const handleSort = () => {
    const nextDirection = getNextSortDirection(sortDirection);
    setSorting({ columnKey, direction: nextDirection });
  };

  const handleResize = (width: number) => {
    setColumnSizing({ columnKey, width });
  };

  return (
    <th>
      <span>{column.label}</span>
      <button onClick={handleSort}>
        <SortIcon direction={sortDirection} />
      </button>
    </th>
  );
};
```

### Benefits of This Pattern

1. **Clear Data Flow**:
   - State flows down via selectors
   - Events flow up via actions

2. **Granular Re-renders**:
   - Component only re-renders when its selected state slice changes
   - Example: Changing column A's width doesn't re-render column B's header

3. **Testability**:
   - Actions can be tested independently
   - Selectors can be tested as pure functions
   - Components can be tested with mocked contexts

4. **Maintainability**:
   - Easy to find where state is read (selectors folder)
   - Easy to find where state is written (actions folder)
   - Business logic is centralized in actions

---

## Advanced Features Implementation

### 1. Virtualization

**Location**: `src/hooks/useVirtualization.hook.ts`

**Purpose**: Render only visible rows for performance

**How it works**:

1. Tracks scroll position of container
2. Calculates which row indices are visible
3. Returns `startIndex`, `endIndex`, `offsetY`, `bottomSpacerHeight`
4. Table body renders only `visibleRows = data.slice(startIndex, endIndex)`
5. Spacer rows fill the non-rendered space

**Usage in TableBody**:

```tsx
const { bottomSpacerHeight, endIndex, offsetY, startIndex, totalHeight } =
  useVirtualization({
    containerRef: tableContainerRef,
    itemHeight: rowHeight,
    overscan: 3,
    totalItems: data.length,
  });

const visibleRows = data.slice(startIndex, endIndex);

return (
  <tbody style={{ height: totalHeight }}>
    <SpacerRow height={offsetY} />
    {visibleRows.map((row, index) => (
      <TableRow key={startIndex + index}>{/* cells */}</TableRow>
    ))}
    <SpacerRow height={bottomSpacerHeight} />
  </tbody>
);
```

### 2. Infinite Scroll

**Location**: `src/components/Table/hooks/useInfiniteScroll.hook.ts`

**Purpose**: Load more data when user scrolls near bottom

**How it works**:

1. Renders a zero-height sentinel element at the end of the scroll container
2. Observes it with `IntersectionObserver` (via shared `useInfiniteScrollObserver`), using `threshold` as the bottom `rootMargin`
3. When the sentinel enters the (margin-expanded) container, calls `fetchMoreData` action
4. Action updates `isLoadingMore` flag and appends new data

**Integration**:

```tsx
// In TableContent.component.tsx
const fetchMoreData = useFetchMoreData<TData, TResponse>();
const hasMore = useGetTableHasMore();
const isLoadingMore = useGetTableIsLoadingMore();

useInfiniteScroll({
  dataSelector,
  dataTotalSelector,
  fetchMoreData, // Action from context
  hasMore, // Selector from context
  isLoadingMore, // Selector from context
  onLoadMore, // Callback from props
  scrollContainerRef,
  sentinelRef, // Sentinel element rendered at end of scroll area
  threshold: 100,
});
```

### 3. Filter Dropdowns with Async Data

**Challenge**: Filter dropdowns may have thousands of options

**Solution**: Each filter has its own data store entry with pagination support

**Flow**:

1. **Initialization** (`getInitialFiltersDataState`):

   ```typescript
   for (const col of columns) {
     cols[col.key] = {
       data: [],
       hasMore: false,
       isLoading: false,
       isLoadingMore: false,
       totalLoadedRows: 0,
       totalRows: 0,
     };
   }
   ```

2. **Initial Load** (FilterPopover opens):

   ```typescript
   const result = await fetchFilterOptions(0);
   setFetchedOptions(result.values);
   setHasMoreOptions(result.hasMore);
   ```

3. **Load More** (user scrolls in dropdown):

   ```typescript
   const fetchMoreFilterData = useFetchMoreFilterData(columnKey);

   // On scroll near bottom:
   await fetchMoreFilterData({
     dataSelector,
     onLoadMore: fetchFilterOptions,
   });
   ```

4. **Render**:

   ```tsx
   const filterData = useGetFilterData(columnKey);

   return (
     <select>
       {filterData.data.map((option) => (
         <option key={option}>{option}</option>
       ))}
       {filterData.isLoadingMore && <Spinner />}
     </select>
   );
   ```

### 4. State Persistence

**Where**: Actions that modify persisted state

**Mechanism**:

- `writeStateSlice()` saves to cookie/localStorage
- `readStateSlice()` restores on mount
- URL search params for shareable state

**Example**:

```typescript
// Save to cookie
writeStateSlice({
  persistenceKey: 'users-table',
  slice: 'columnFilters',
  storageType: 'cookie',
  value: newFilters,
});

// Update URL
setSearchParams((params) => {
  params.set('filters', JSON.stringify(newFilters));
  return params;
});
```

---

## Performance Optimizations

### 1. Shallow Equality in Store

Only notify subscribers if state actually changed:

```typescript
const set = (value: Partial<TData>) => {
  const prev = store.current;
  const next = { ...prev, ...value };

  if (!shallowEqual({ objA: prev, objB: next })) {
    store.current = next;
    for (const callback of listeners.current) callback();
  }
};
```

### 2. Granular Subscriptions

Component subscribes only to needed state slice:

```typescript
// Component only re-renders when sorting changes, NOT when filters change
const sorting = useGetColumnsSorting();
```

### 3. Memoization

Selectors can use derived state without recalculating:

```typescript
// normalizedColumns is pre-computed and stored
const normalizedColumns = useGetNormalizedColumns();
```

### 4. Virtualization

Only render visible rows (e.g., 20 out of 10,000).

### 5. Callback Stability

Actions return stable callbacks via `useCallback`:

```typescript
return useCallback(
  ({ columnKey, direction }) => {
    // mutation logic
  },
  [columnsStore, metaStore],
);
```

---

## Type Safety

### Generic Components

All components are generic over `TData`:

```typescript
export const Table = <TData extends Record<string, unknown>, TResponse>(
  {
    // props
  }: TableProps<TData, TResponse>,
) => {
  // ...
};
```

### Type-Safe Keys

Column keys are typed as `DataKey<TData>`:

```typescript
export type DataKey<TData> = (keyof TData & string) | string;
```

Ensures column keys match data object keys.

### Store Typing

Stores are strongly typed:

```typescript
const dataStore = useStore<TableDataState<TData>>(initialState);
const columnsStore = useStore<TableColumnsState<TData>>(initialState);
```

---

## Migration Guide for Other Components

Use this architecture when building components that need:

- ✅ Complex state with multiple related pieces
- ✅ Frequent state updates (e.g., real-time data)
- ✅ Granular re-render control
- ✅ Async operations (data fetching, pagination)
- ✅ State persistence
- ✅ Performance-critical rendering (virtualization)

### Step-by-Step Migration

#### 1. Identify State Domains

Split state into logical domains:

- **Config**: Changes infrequently (settings, columns, layout)
- **Data**: Changes frequently (items, loading states)
- **UI**: Transient state (modals, selections)

#### 2. Create Context Providers

For each domain, create:

- Context definition
- Provider component
- Context value hook

```typescript
// MyContext.context.ts
export const MyContext = createContext<MyContextValue | null>(null);

// MyContext.provider.tsx
export const MyProvider = ({ children, initialState }) => {
  const store = useStore<MyState>(initialState);
  return <MyContext.Provider value={{ store }}>{children}</MyContext.Provider>;
};

// useMyContextValue.hook.ts
export const useMyContextValue = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContextValue must be within MyProvider');
  return context;
};
```

#### 3. Create Base Store Hooks

```typescript
// useMyStore.hook.ts
export const useMyStore = <TSelected>(
  selector: (state: MyState) => TSelected,
) => {
  const { store } = useMyContextValue();

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get() as MyState),
    () => selector(store.getServerSnapshot() as MyState),
  );
};
```

#### 4. Build Selectors

Create a selector for each state slice:

```typescript
// selectors/useGetItems.hook.ts
export const useGetItems = () => useMyStore((state) => state.items);

// selectors/useGetIsLoading.hook.ts
export const useGetIsLoading = () => useMyStore((state) => state.isLoading);
```

#### 5. Build Actions

Create an action for each mutation:

```typescript
// actions/useAddItem.hook.ts
export const useAddItem = () => {
  const { store } = useMyContextValue();

  return useCallback(
    (item: Item) => {
      const state = store.get();
      const newItems = [...state.items, item];
      store.set({ items: newItems });
    },
    [store],
  );
};

// actions/useFetchItems.hook.ts
export const useFetchItems = () => {
  const { store } = useMyContextValue();

  return async () => {
    store.set({ isLoading: true });
    try {
      const items = await api.fetchItems();
      store.set({ items, isLoading: false });
    } catch (error) {
      store.set({ error: error.message, isLoading: false });
    }
  };
};
```

#### 6. Connect UI Components

```typescript
// MyComponent.tsx
export const MyComponent = () => {
  // Selectors
  const items = useGetItems();
  const isLoading = useGetIsLoading();

  // Actions
  const addItem = useAddItem();
  const fetchItems = useFetchItems();

  // Handlers
  const handleAdd = () => addItem({ id: Date.now(), name: 'New' });

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return (
    <div>
      {isLoading ? <Spinner /> : items.map(item => <Item key={item.id} {...item} />)}
      <button onClick={handleAdd}>Add</button>
    </div>
  );
};
```

#### 7. Add Virtualization (if needed)

```typescript
const { startIndex, endIndex, offsetY, bottomSpacerHeight } = useVirtualization(
  {
    containerRef,
    itemHeight: 50,
    totalItems: items.length,
  },
);

const visibleItems = items.slice(startIndex, endIndex);
```

#### 8. Add Infinite Scroll (if needed)

```typescript
const fetchMore = useFetchMoreItems();

useInfiniteScroll({
  fetchMoreData: fetchMore,
  hasMore,
  isLoadingMore,
  scrollContainerRef,
  sentinelRef,
  threshold: 100,
});
```

---

## Folder Structure

```
Table/
├── Table.component.tsx               # Entry point
├── Table.types.ts                    # All type definitions
├── TableContext/
│   ├── TableConfigContext.provider.tsx
│   ├── TableDataContext.provider.tsx
│   └── hooks/
│       ├── store/
│       │   ├── columns/
│       │   │   ├── useColumnsStore.hook.ts
│       │   │   ├── actions/
│       │   │   │   ├── useSetColumnFilter.hook.ts
│       │   │   │   ├── useSetColumnSorting.hook.ts
│       │   │   │   └── index.ts
│       │   │   └── selectors/
│       │   │       ├── useGetColumns.hook.ts
│       │   │       ├── useGetColumnFilters.hook.ts
│       │   │       └── index.ts
│       │   ├── data/
│       │   │   ├── useDataStore.hook.ts
│       │   │   ├── actions/
│       │   │   │   ├── useFetchMoreData.hook.ts
│       │   │   │   └── index.ts
│       │   │   └── selectors/
│       │   │       ├── useGetTableData.hook.ts
│       │   │       ├── useGetTableIsLoading.hook.ts
│       │   │       └── index.ts
│       │   ├── filters/
│       │   │   ├── useFiltersStore.hook.ts
│       │   │   ├── actions/
│       │   │   │   ├── useFetchMoreFilterData.hook.ts
│       │   │   │   └── index.ts
│       │   │   └── selectors/
│       │   │       ├── useGetFilterData.hook.ts
│       │   │       └── index.ts
│       │   └── meta/
│       │       ├── useMetaStore.hook.ts
│       │       ├── actions/
│       │       └── selectors/
│       ├── useTableConfigContextValue.hook.ts
│       └── useTableDataContextValue.hook.ts
├── TableHeader/
├── TableBody/
│   └── TableBody.component.tsx       # Uses virtualization
├── TableHeaderCell/
│   ├── TableHeaderCell.component.tsx # Uses actions + selectors
│   └── FilterPopover/
│       └── FilterPopover.component.tsx # Uses filter actions + selectors
└── hooks/
    ├── useVirtualization.hook.ts
    └── useInfiniteScroll.hook.ts
```

---

## Key Takeaways

1. **Two-Provider Pattern**: Separate config (slow-changing) from data (fast-changing)

2. **Action/Selector Separation**: Clear boundary between reads and writes

3. **Granular Subscriptions**: Components re-render only when their selected slice changes

4. **Type-Safe Generics**: Full TypeScript support across all layers

5. **Performance by Default**: Shallow equality checks + virtualization + stable callbacks

6. **Scalable Structure**: Easy to add new state slices, actions, or selectors

7. **Testable**: Actions, selectors, and components can be tested independently

8. **SSR-Ready**: `getServerSnapshot` ensures hydration works correctly

---

## Common Patterns

### Pattern: Conditional Actions

When actions depend on context state, access it inside the action:

```typescript
export const useToggleSorting = () => {
  const { columnsStore } = useTableConfigContextValue();

  return useCallback(
    (columnKey: string) => {
      const state = columnsStore.get();
      const currentSorting = state?.sorting ?? [];
      const existing = currentSorting.find((s) => s.key === columnKey);

      const newDirection = existing?.direction === 'asc' ? 'desc' : 'asc';
      // ... update logic
    },
    [columnsStore],
  );
};
```

### Pattern: Multi-Store Actions

When action needs to update multiple stores:

```typescript
export const useResetTable = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();

  return useCallback(() => {
    columnsStore.reset();
    metaStore.reset();
    dataStore.reset();
  }, [columnsStore, metaStore, dataStore]);
};
```

### Pattern: Computed Selectors

When derived state is expensive, compute and store it:

```typescript
// In store initialization
const normalizedColumns = getNormalizedColumns({ columns, sorting });
columnsStore.set({ normalizedColumns });

// Then use a simple selector
export const useGetNormalizedColumns = () =>
  useColumnsStore((state) => state.normalizedColumns);
```

---

## Conclusion

This architecture provides a robust foundation for building complex, performant UI components. The action/selector pattern ensures maintainability, the store-based approach enables granular re-renders, and the clear separation of concerns makes the codebase easy to navigate and extend.

Apply this pattern to any component with similar needs: complex state, async operations, virtualization, or performance-critical rendering.
