# TableData Context Architecture

Manages the actual table row data, loading states, and pagination. Lives inside
the Suspense boundary so loading/error states are handled by React transitions.

## File Structure

```
TableData/
├── TableDataContext.context.ts              → createContext (undefined default)
├── TableDataContext.provider.tsx             → Provider: creates store and syncs incoming loader data into existing store
├── TableDataContext.types.ts                → TableDataState, ContextValue
├── index.ts                                 → Barrel: TableDataProvider, hooks
│
├── data/
│   ├── useDataStore.hook.ts                 → useSyncExternalStore + selector
│   ├── useTableDataContextValue.hook.ts     → use(TableDataContext) with guard
│   │
│   ├── actions/
│   │   └── useFetchMoreData.hook.ts         → Fetch next page of table data
│   │
│   └── selectors/
│       ├── useGetTableData.hook.ts          → Full data array
│       ├── useGetTableDataError.hook.ts     → Why the read returned nothing, when it said
│       ├── useGetTableHasMore.hook.ts       → Whether more pages exist
│       ├── useGetTableIsLoading.hook.ts     → Initial loading state
│       ├── useGetTableIsLoadingMore.hook.ts → Pagination loading state
│       ├── useGetTableTotalLoadedRows.hook.ts → Loaded row count
│       └── useGetTableTotalRows.hook.ts     → Total records count
│
└── utils/

    ├── getInitialDataState.util.ts          → Build initial state with derived fields
    └── index.ts                             → Barrel: utils
```

## Store Pattern

```mermaid
graph LR
  subgraph "TableDataContext"
    Provider["TableDataProvider"] -->|"getInitialDataState(props)"| Init["initialState"]
    Init -->|"useStore(initialState)"| DS["dataStore (TStore)"]
    DS -->|"get()"| Snap["Snapshot"]
    DS -->|"set(partial)"| Merge["Shallow merge & notify"]
    DS -->|"subscribe(cb)"| Subs["Listener list"]
  end

  useDataStore["useDataStore(selector)"] -->|"useSyncExternalStore"| DS
```

## State Shape

```typescript
TableDataState<TData> = {
  data: TData[];           // Current loaded rows
  error: TableResponseError | undefined; // Why the read returned nothing (ADR-068)
  hasMore: boolean;        // More pages available (derived: totalRows > totalLoadedRows)
  isLoading: boolean;      // Initial fetch in progress
  isLoadingMore: boolean;  // Subsequent page fetch in progress
  totalLoadedRows: number; // data.length (derived)
  totalRows: number;       // Total row count from server
};
```

`error` is **required and nullable**, not optional, and `getInitialDataState`
always emits the key. The provider re-seeds through the store's shallow merge,
which keeps every key the next state does not name — so an omitted `error` would
leave the previous read's refusal on screen after the navigation that resolved
it. `Table` fills it by running the `dataErrorSelector` prop over the response,
which `TableRouteView` defaults to `response.error`.

## Provider Initialization

```mermaid
graph TD
  A["TableDataProvider receives initial data + totalRows"]
  A --> B["getInitialDataState(dataState)"]
  B --> C["useStore(initialState) → dataStore"]
  C --> D["effect on dataState change"]
  D --> E["dataStore.set(getInitialDataState(dataState))"]
  E --> F["Provide via TableDataContext"]
```

This keeps the same store instance mounted across transitions and atomically
replaces rows when new loader data resolves.

## Actions

| Hook               | Reads From               | Writes To   | Description                                                                                       |
| ------------------ | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| `useFetchMoreData` | `dataStore`, `metaStore` | `dataStore` | Appends next page; configurable page size; opt-in prefetch buffer; direct `dataStore.set()` calls |

### Prefetch Buffer (ADR-006)

When `enablePrefetch` is true in `metaStore`, `useFetchMoreData` silently fetches the next page
after each load-more completes using the shared `firePrefetch` utility from `@/utils/prefetch`.
On the next scroll trigger, cached data is consumed via `resolveFromCacheOrFetch` — instantly (cache hit)
or by awaiting the in-flight request (cache in-flight). Stale cache is automatically invalidated when
sort/filter changes reset data (skip mismatch → cache miss).

```
Scroll trigger
  ├─ prefetchRef.skip matches? ──► YES: data exists? ──► HIT (instant)
  │                                                   └──► IN-FLIGHT (await promise)
  └─ NO: MISS ──► normal onLoadMore() call

After fetch:
  └─ enablePrefetch && hasMore? ──► fire background onLoadMore() ──► store in prefetchRef
```

## Selectors

| Hook                         | Returns                           | Description                                              |
| ---------------------------- | --------------------------------- | -------------------------------------------------------- |
| `useGetTableData`            | `TData[]`                         | Full array of loaded rows                                |
| `useGetTableDataError`       | `TableResponseError \| undefined` | Why the read returned no rows, when the endpoint said so |
| `useGetTableHasMore`         | `boolean`                         | Whether more pages can be fetched                        |
| `useGetTableIsLoading`       | `boolean`                         | Initial loading state                                    |
| `useGetTableIsLoadingMore`   | `boolean`                         | Pagination loading state                                 |
| `useGetTableTotalLoadedRows` | `number`                          | Number of currently loaded rows                          |
| `useGetTableTotalRows`       | `number`                          | Total record count from data source                      |
