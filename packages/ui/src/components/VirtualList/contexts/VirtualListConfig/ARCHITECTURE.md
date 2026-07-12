# VirtualListConfig Context Architecture

Config + UI-state context for `VirtualList` (Table analog: `TableConfig` with its `columns`/`meta` slices). Holds two stores and the parent callbacks.

## Context Value

| Member           | Kind                             | Purpose                                                                                                                           |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `configStore`    | `TStore<VirtualListConfigState>` | Static flags (`hasCheckboxes`, `hasSelectAll`, `hasFetchInitial`, `hasFetchMore`, `name`), synced from props by a provider effect |
| `uiStore`        | `TStore<VirtualListUiState>`     | List-owned UI state (`searchTerm`, `listFilterMode`), seeded once, written only by UI actions                                     |
| `onChange`       | callback                         | Selection emit path (actions only — selection is parent-owned)                                                                    |
| `onFetchInitial` | callback (optional)              | Mount fetch (used by `VirtualListDataProvider`)                                                                                   |
| `onFetchMore`    | callback (optional)              | Infinite-scroll fetch (used by `useFetchMore`)                                                                                    |

Callbacks live on the context value (not in a store) like `TableWrapper`'s ref: they are infrastructure members reachable only from actions/providers, never from selectors or components.

## Slices

### `config/` — static configuration

- `useListConfigStore.hook.ts` — `useSyncExternalStore` wrapper with `?? INITIAL_LIST_CONFIG_STATE` fallback.
- `selectors/` — `useGetHasCheckboxes`, `useGetHasFetchMore`, `useGetSearchInputName` (one-liners).

### `ui/` — list-owned UI state

- `useListUiStore.hook.ts` — `useSyncExternalStore` wrapper with `?? INITIAL_LIST_UI_STATE` fallback.
- `selectors/` — `useGetSearchTerm`, `useGetListFilterMode` (one-liners).
- `actions/` — `useSetSearchTerm`, `useClearSearch` (wraps `useSetSearchTerm('')`), `useSetListFilterMode`. The two setters are cross-context actions: they snapshot `configStore`/`uiStore`/`dataStore` once each, write the UI field, and recompute the derived slice of `dataStore` via `resolveListDerivedState` (same shape as `useSetColumnFilter` writing `dataStore` from `TableConfig`).

## Testing

- `config/config.hooks.test.tsx` / `ui/ui.hooks.test.tsx` — selectors, actions (incl. cross-context derived recompute), fallback branches, throw guard, via `createMockStore` + raw context wrappers.
- `VirtualListConfigContext.provider.test.tsx` — prop seeding + config sync effect.
- `utils/*.util.test.ts` — initial-state builders.
