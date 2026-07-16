# FiltersData Context Architecture

Manages filter lookup data per column. Placed **above** the Suspense boundary so
dropdown options survive loading transitions when the table re-fetches.

## File Structure

```
FiltersData/
├── FiltersDataContext.context.ts            → createContext (undefined default)
├── FiltersDataContext.provider.tsx           → Provider: builds store from columns
├── FiltersDataContext.types.ts              → FiltersDataState, ContextValue
├── useFiltersDataContextValue.hook.ts       → use(FiltersDataContext) with guard
├── index.ts                                 → Barrel: FiltersDataProvider
│
└── filters/
    ├── useFiltersStore.hook.ts              → useSyncExternalStore + selector
    │
    ├── actions/
    │   ├── useFetchFilterData.hook.ts        → Lightweight orchestrator that composes initial + paginated fetch actions
    │   ├── useFetchFilterData.types.ts       → Action/callback Args types shared by the fetchers
    │   ├── fetchInitialFilterData.util.ts    → Initial filter options load + optional prefetch trigger
    │   ├── fetchMoreFilterData.util.ts       → Paginated filter options append + cache/prefetch handling
    │   ├── executeFetchMoreFilterData.util.ts → Shared fetch-more execution flow (set loading, read cache/fetch, append, prefetch)
    │   ├── handleFetchMoreFilterDataError.util.ts → Shared fetch-more error handling (meta error + loading reset)
    │   │   (initial + more fetchers share maybePrefetchFilterPage.util.ts for the prefetch trigger)
    │   ├── clearPrefetchIfPresent.util.ts    → Reset the prefetch cache when a prefetch ref exists
    │   ├── getTotalRows.util.ts              → Resolve total row count from a fetch response
    │   ├── shouldSkipInitialFetch.util.ts    → Guard against redundant initial loads
    │   └── setFilterSlice.util.ts            → Single audited computed-key store write (contains the one Partial cast)
    │
    ├── selectors/
    │   └── useGetFilterData.hook.ts         → Read filter data for a column
    │
    └── utils/
        └── getInitialFiltersDataState.util.ts → Build initial per-column state
```

## Store Pattern

```mermaid
graph LR
  subgraph "FiltersDataContext"
    Provider["FiltersDataProvider"] -->|"columns → getInitialFiltersDataState()"| Init["initialState"]
    Init -->|"useStore(initialState)"| FS["filtersDataStore (TStore)"]
    FS -->|"get()"| Snap["Snapshot"]
    FS -->|"set(partial)"| Merge["Shallow merge & notify"]
    FS -->|"subscribe(cb)"| Subs["Listener list"]
  end

  useFiltersStore["useFiltersStore(selector)"] -->|"useSyncExternalStore"| FS
```

## State Shape

```typescript
// Per-column filter data
FiltersDataColumnState = {
  data: unknown[];       // Available filter options
  hasMore: boolean;      // More pages available
  isLoading: boolean;    // Currently fetching
  isLoadingMore: boolean; // Fetching next page
  searchText: string;    // Current search filter
};

// Top-level state: keyed by column accessor
FiltersDataState = Record<string, FiltersDataColumnState>;
```

## Provider Initialization

```mermaid
graph TD
  A["FiltersDataProvider receives columns + children"]
  A --> B["getInitialFiltersDataState(columns)"]
  B --> C["For each filterable column → create FiltersDataColumnState"]
  C --> D["useStore(initialState) → filtersDataStore"]
  D --> E["Provide via FiltersDataContext"]
```

## Actions

| Hook                        | Reads From         | Writes To          | Description                                                                       |
| --------------------------- | ------------------ | ------------------ | --------------------------------------------------------------------------------- |
| `useFetchFilterData`        | `filtersDataStore` | `filtersDataStore` | Composes and returns the initial and paginated filter data actions for one column |
| `useFetchInitialFilterData` | `filtersDataStore` | `filtersDataStore` | Loads the first page, computes `hasMore`, and optionally triggers prefetch        |
| `useFetchMoreFilterData`    | `filtersDataStore` | `filtersDataStore` | Appends next page from cache/network, updates totals, and optionally prefetches   |

## Selectors

| Hook               | Returns                  | Description                               |
| ------------------ | ------------------------ | ----------------------------------------- |
| `useGetFilterData` | `FiltersDataColumnState` | Returns filter data for a specific column |
