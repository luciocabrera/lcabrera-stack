# VirtualList Contexts Architecture

Split-context external-store architecture for `VirtualList`, mirroring `Table/contexts/` (ADR-003, `store-pattern` skill). Two contexts, split by volatility, each in its own folder with slice subfolders holding the store hook, selectors, and actions.

## Context Map

| Context             | Purpose                                             | Store/Value                                        |
| ------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `VirtualListConfig` | Static config + list-owned UI state + callbacks     | `configStore`, `uiStore` (+ `onChange`/`onFetch*`) |
| `VirtualListData`   | Mirror of controlled data/selection + derived state | `dataStore`                                        |

## Provider Order (Why It Matters)

1. `VirtualListConfigProvider` — creates `configStore` (synced from props) and `uiStore` (seeded once, written by UI actions); exposes the parent callbacks. **Single prop intake for all config/callbacks.**
2. `VirtualListDataProvider` — takes only the controlled data props (`dataState`, `filter`); creates `dataStore`. It reads everything else from the config context — `uiStore` via the context value, `hasSelectAll`/`hasFetchInitial` reactively via the config selectors, and `onFetchInitial` for the mount fetch — so it **must render inside** the config provider.

## Single-Owner State Rule

No piece of state is ever passed to two providers or mirrored into two stores. Each value has exactly one owning store; cross-context readers go through that owner's selectors (the data provider subscribing to `useGetHasSelectAll`/`useGetHasFetchInitial` keeps derived state reactive to config changes without duplicating the props).

## Who Mounts the Providers

- `VirtualList` (standalone use) mounts both providers around `VirtualListContent`.
- A composing component may **lift** them instead and render `VirtualListContent` itself — `VirtualSelect` is the canonical example: its shell mounts the providers (config `onChange` carries the select's label→value mapping) so `VirtualSelectHeader` can read `useGetSelectedValues`/dispatch `useToggleOption` even while the dropdown is closed. Lifting moves the store lifetime (and the `onFetchInitial` mount effect) to the composing component.

## Derived State Rule

`dataStore` holds the raw mirror (`data`, `hasMore`, `isLoading`, `isLoadingMore`, `selectedValues`, `totalCount`) **plus pre-computed derived state** (`filteredOptions`, `isAllSelected`, `shouldShowSelectAll`, `totalItems`, `contentMode`). Selectors are strict one-liners over one slice store hook — derivation never happens in selectors. The derived slice is recomputed by exactly two writers, both delegating to the pure `resolveListDerivedState` util (`../utils/`):

- **`VirtualListDataProvider` sync effect** — when the controlled props (`dataState`, `filter`) or the selector-read config flags (`hasSelectAll`, `hasFetchInitial`) change.
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
│   ├── config/                     → useListConfigStore + selectors/ (hasCheckboxes, hasFetchInitial,
│   │                                 hasFetchMore, hasSelectAll, listMaxHeight, name, shouldFillHeight)
│   └── ui/                         → useListUiStore + selectors/ (searchTerm, listFilterMode)
│                                     + actions/ (setSearchTerm, clearSearch, setListFilterMode)
└── VirtualListData/
    ├── VirtualListDataContext.{context,provider,types,constants}.ts(x)
    ├── useVirtualListDataContextValue.hook.ts
    ├── utils/                      → getInitialListDataState (mirror + derived)
    └── data/                       → useListDataStore + selectors/ (13 one-liners)
                                      + actions/ (toggleOption, toggleSelectAll, fetchMore) + utils/
```
