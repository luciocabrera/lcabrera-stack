# VirtualList Contexts Architecture

Split-context external-store architecture for `VirtualList`, mirroring `Table/contexts/` (ADR-003, `store-pattern` skill). Two contexts, split by volatility, each in its own folder with slice subfolders holding the store hook, selectors, and actions.

## Context Map

| Context             | Purpose                                             | Store/Value                                        |
| ------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `VirtualListConfig` | Static config + list-owned UI state + callbacks     | `configStore`, `uiStore` (+ `onChange`/`onFetch*`) |
| `VirtualListData`   | Mirror of controlled data/selection + derived state | `dataStore`                                        |

## Provider Order (Why It Matters)

1. `VirtualListConfigProvider` — creates `configStore` (synced from props) and `uiStore` (seeded once, written by UI actions); exposes the parent callbacks.
2. `VirtualListDataProvider` — creates `dataStore`; its sync effect reads `uiStore` from the config context, so it **must render inside** the config provider.

## Derived State Rule

`dataStore` holds the raw mirror (`data`, `hasMore`, `isLoading`, `isLoadingMore`, `selectedValues`, `totalCount`) **plus pre-computed derived state** (`filteredOptions`, `isAllSelected`, `shouldShowSelectAll`, `totalItems`, `contentMode`). Selectors are strict one-liners over one slice store hook — derivation never happens in selectors. The derived slice is recomputed by exactly two writers, both delegating to the pure `resolveListDerivedState` util (`../utils/`):

- **`VirtualListDataProvider` sync effect** — when the controlled props (`dataState`, `filter`, `hasSelectAll`, `onFetchInitial`) change.
- **UI actions** (`useSetSearchTerm`, `useSetListFilterMode`) — when the search term or filter mode changes.

## Contract: Component vs Infrastructure

Same as the Table (see `.github/skills/store-pattern`):

- View components use only `useGet*` selectors and action hooks — never `useVirtualList*ContextValue`, never `store.get()`/`store.set()`.
- Selectors read through `useListConfigStore` / `useListUiStore` / `useListDataStore` only; no selector calls another selector or a context-value hook.
- Actions snapshot each store once per execution and may orchestrate cross-context (UI actions write `dataStore`; data actions read `onChange` from the config context value).
- Selection is parent-owned: toggle actions emit the next `SelectFilter` through `onChange`; the mirror updates on the prop round-trip.

## Folder Layout

```
contexts/
├── index.ts                        → { VirtualListConfigProvider, VirtualListDataProvider }
├── VirtualListConfig/
│   ├── VirtualListConfigContext.{context,provider,types,constants}.ts(x)
│   ├── useVirtualListConfigContextValue.hook.ts
│   ├── utils/                      → getInitialListConfigState, getInitialListUiState
│   ├── config/                     → useListConfigStore + selectors/ (hasCheckboxes, hasFetchMore, name)
│   └── ui/                         → useListUiStore + selectors/ (searchTerm, listFilterMode)
│                                     + actions/ (setSearchTerm, clearSearch, setListFilterMode)
└── VirtualListData/
    ├── VirtualListDataContext.{context,provider,types,constants}.ts(x)
    ├── useVirtualListDataContextValue.hook.ts
    ├── utils/                      → getInitialListDataState (mirror + derived)
    └── data/                       → useListDataStore + selectors/ (13 one-liners)
                                      + actions/ (toggleOption, toggleSelectAll, fetchMore) + utils/
```
