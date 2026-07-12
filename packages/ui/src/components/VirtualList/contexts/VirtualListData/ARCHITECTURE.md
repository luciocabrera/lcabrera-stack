# VirtualListData Context Architecture

Data context for `VirtualList` (Table analog: `TableData`). Holds the single `dataStore`: a mirror of the controlled `dataState`/`filter` props plus the pre-computed derived list state.

## Store Shape (`VirtualListDataStoreState`)

| Slice   | Fields                                                                                 | Written by                                                    |
| ------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Mirror  | `data`, `hasMore`, `isLoading`, `isLoadingMore`, `selectedValues`, `totalCount`        | Provider sync effect only (props → store)                     |
| Derived | `filteredOptions`, `isAllSelected`, `shouldShowSelectAll`, `totalItems`, `contentMode` | Provider sync effect + UI actions (`resolveListDerivedState`) |

Selection is parent-owned: no action writes `selectedValues`; `useToggleOption`/`useToggleSelectAll` emit the next `SelectFilter` through the config context's `onChange` and the mirror updates when the parent's `filter` prop round-trips.

## Provider

`VirtualListDataProvider` must render inside `VirtualListConfigProvider` (it reads `uiStore` for the search/mode snapshot used by the sync effect). Props: `dataState`, `filter?`, `hasSelectAll`, `onFetchInitial?`. Effects:

1. **Sync effect** — re-seeds the store via `getInitialListDataState` whenever `dataState`/`filter`/`hasSelectAll`/`onFetchInitial` change (mirrors `TableDataProvider`).
2. **Mount fetch** — invokes `onFetchInitial` once.

## `data/` Slice

- `useListDataStore.hook.ts` — `useSyncExternalStore` wrapper with `?? INITIAL_LIST_DATA_STATE` fallback.
- `selectors/` — 13 one-liners: `useGetContentMode`, `useGetFilteredOptions`, `useGetHasMore`, `useGetIsAllSelected`, `useGetIsLoading`, `useGetIsLoadingMore`, `useGetIsLoadingOptions`, `useGetLoadedCount`, `useGetSelectedCount`, `useGetSelectedValues`, `useGetShouldShowSelectAll`, `useGetTotalCount`, `useGetTotalItems`.
- `actions/` — `useToggleOption`, `useToggleSelectAll` (read the stored derived slice from one snapshot, delegate to `actions/utils/resolve*Filter` and emit via `onChange`), `useFetchMore` (invokes the config context's `onFetchMore`).

## Testing

- `data/data.hooks.test.tsx` — every selector/action, fallback branch, throw guard, via `createMockStore` + raw context wrappers.
- `VirtualListDataContext.provider.test.tsx` — seeding (mirror + derived), prop sync, one-shot `onFetchInitial`.
- `utils/getInitialListDataState.util.test.ts`, `data/actions/utils/*.util.test.ts` — pure resolvers.
