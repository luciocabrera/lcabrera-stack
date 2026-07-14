# VirtualList Contexts Architecture

Single-context external-store architecture for `VirtualList`, mirroring `Table/contexts/TableConfig/` (ADR-003, `store-pattern` skill): **one context, stores per concern**. `VirtualListContext` holds two independent stores (`listStore` + `dataStore`) plus the parent callbacks, each concern in its own slice folder with a store hook, selectors, and (where writable) actions.

The three former providers (`VirtualSelectConfig` + `VirtualListConfig` + `VirtualListData`) collapsed into this one context because they shared a single mount point and lifecycle — the split only added cross-context plumbing (the data provider read the config context during render; UI actions read both contexts). Re-render isolation comes from the stores' `useSyncExternalStore` subscriptions, not from context boundaries, so nothing was lost by merging.

## Context Map

| Store       | Purpose                                                 | State type                         |
| ----------- | ------------------------------------------------------- | ---------------------------------- |
| `listStore` | Config props mirror **+** list-owned UI state           | `VirtualListState` (config `&` ui) |
| `dataStore` | Mirror of controlled data/selection **+** derived state | `VirtualListDataStoreState`        |

The context value also carries `onChange` and `onFetchMore` (parent callbacks reachable only by actions).

## Writer-Boundary Rule (single-owner state)

`VirtualListState` is `VirtualListConfigState & VirtualListUiState`, but the two halves have **different writers** — this is the invariant that replaces the old two-store split:

- **Config fields** (`hasCheckboxes`, `hasSelectAll`, `hasFetchInitial`, `hasFetchMore`, `listMaxHeight`, `name`, `shouldFillHeight`) are mirrored from props by the provider's list-sync effect, and by nothing else.
- **UI fields** (`searchTerm`, `listFilterMode`) are written only by the UI actions, seeded once, and must survive prop re-syncs.

The provider's list-sync effect re-reads the current UI fields from `listStore.get()` and passes them back into `getInitialListState`, so every write is **total** yet never clobbers in-flight UI state. (`VirtualListContext.provider.test.tsx` guards this with a set-search-term-then-change-a-config-prop test.) No value is ever passed to two stores; cross-concern reads (the data-sync effect reading `searchTerm`/`listFilterMode`) snapshot `listStore` directly.

## Who Mounts the Provider

- `VirtualList` (standalone use) mounts `VirtualListProvider` around `VirtualListContent`.
- A composing component provides the same context by composing the provider — `VirtualSelect` is the canonical example: `VirtualSelectProvider` provides its own `VirtualSelectContext` **and renders `VirtualListProvider` around `children`**, so `VirtualSelectHeader` can read `useGetSelectedValues`/dispatch `useToggleOption` even while the dropdown is closed. Composition (not shell-side nesting) keeps each mount site at exactly one provider; the store lifetime and the `onFetchInitial` mount effect live with the provider.

## Grouped Provider Props

Following `TableConfigProvider`'s `columnsState`/`metaState` shape, `VirtualListProvider` takes `dataState`, `filter`, and one `listState` group (`Omit<VirtualListProps, 'dataState' | 'filter'>`) rather than a dozen loose keys. `getInitialListState(listState)` derives `hasFetchInitial`/`hasFetchMore` from the callbacks and defaults the UI fields.

## Derived State Rule

`dataStore` holds the raw mirror (`data`, `hasMore`, `isLoading`, `isLoadingMore`, `selectedValues`, `totalCount`) **plus pre-computed derived state** (`filteredOptions`, `isAllSelected`, `shouldShowSelectAll`, `totalItems`, `contentMode`). Selectors are strict one-liners over one slice store hook — derivation never happens in selectors. The derived slice is recomputed by exactly two writers, both delegating to the pure `resolveListDerivedState` util (`../utils/`):

- **`VirtualListProvider` data-sync effect** — when the controlled props (`dataState`, `filter`), the config flags (`hasSelectAll`, `hasFetchInitial`), or the UI fields change.
- **UI actions** (`useSetSearchTerm`, `useSetListFilterMode`) — when the search term or filter mode changes.

## Contract: Component vs Infrastructure

Same as the Table (see `.github/skills/store-pattern`):

- View components use only `useGet*` selectors and action hooks — never `useVirtualListContextValue`, never `store.get()`/`store.set()`.
- Selectors read through `useListStore` / `useListDataStore` only; no selector calls another selector or a context-value hook.
- Actions snapshot each store once per execution (UI actions write `listStore` then `dataStore`; data actions read `onChange`/`onFetchMore` from the context value).
- Selection is parent-owned: toggle actions emit the next `SelectFilter` through `onChange`; the mirror updates on the prop round-trip.

## Folder Layout

```
contexts/
├── index.ts                        → { VirtualListProvider }
├── VirtualListContext.{context,provider,types,constants}.ts(x)
├── useVirtualListContextValue.hook.ts
├── utils/                          → getInitialListState (config + ui), getInitialListDataState (mirror + derived)
├── list/                          → useListStore + selectors/ (hasCheckboxes, hasFetchInitial, hasFetchMore,
│                                    hasSelectAll, listFilterMode, listMaxHeight, searchInputName, searchTerm,
│                                    shouldFillHeight) + actions/ (setSearchTerm, clearSearch, setListFilterMode)
└── data/                          → useListDataStore + selectors/ (13 one-liners)
                                     + actions/ (toggleOption, toggleSelectAll, fetchMore) + utils/
```
