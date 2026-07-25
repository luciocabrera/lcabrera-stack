# VirtualListBody Architecture

Scroll-container owner (Table analog: `TableContent`): renders the scrollable viewport and the infinite-scroll sentinel. Filtering/selection/content state comes from the `contexts/` selectors; the derivation layer that used to live here (`resolveVirtualListBodyState`) now lives in `utils/resolveListDerivedState`, pre-computed into the data store.

## Responsibilities

- Own `scrollContainerRef` (viewport) and `sentinelRef` (1px sentinel) and the container styling (`listMaxHeight` / `shouldFillHeight` variants)
- Render the sentinel **only in the `list` content mode**, on the `hasListEnd` flag the hook returns — see [Sentinel lifetime](#sentinel-lifetime)
- Delegate the whole observer wiring to `hooks/useVirtualListInfiniteScroll` (every observer input, the `shouldFetchToFill` guard, the `useFetchMore` dispatch), keeping this component about layout
- Delegate virtualization and content-mode dispatch to `VirtualListBodyChildren` (receives only `scrollContainerRef`, producer→direct-child)

The initial fetch effect lives in `VirtualListProvider`; the toggle/select-all handlers moved to the `useToggleOption`/`useToggleSelectAll` actions.

## Sentinel lifetime

The sentinel is an in-flow sibling of `VirtualListBodyChildren` inside the scroll
container, so it contributes its own height to `scrollHeight`. In the `empty` and
`loading` modes the children render no rows, which makes the sentinel the only
source of overflow — enough to paint a scrollbar over "No options found" and to
pass `useInfiniteScrollObserver`'s `root.scrollHeight <= root.clientHeight` test as
a genuine scrolled-to-bottom. That defeated the `shouldFetchToFill` guard and walked
the entire dataset one page at a time whenever a search term or filter mode left
nothing to show (#432).

So `hasListEnd = contentMode === 'list'` gates both the conditional render and
`isEnabled`. Gating `isEnabled` is what makes the pair work: the observer effect
re-runs on an `isEnabled` change, which is what re-attaches the observer to the
freshly mounted sentinel when the filter is cleared.

One behaviour follows from this and is intended: a consumer that wires only
`onFetchMore` no longer bootstraps its first page from an under-filled empty
container. `onFetchInitial` is the entry point for that.

## Props

| Prop               | Type      | Description                        |
| ------------------ | --------- | ---------------------------------- |
| `listMaxHeight`    | `string`  | Max-height for non-fill mode       |
| `shouldFillHeight` | `boolean` | Uses fill-height container variant |

## Store Wiring

| Kind      | Hooks                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selectors | `useGetListMaxHeight`, `useGetShouldFillHeight` (config) here; `useGetContentMode`, `useGetHasMore`, `useGetIsLoadingOptions` (data) + `useGetHasFetchMore`, `useGetListFilterMode`, `useGetSearchTerm` (config) in the hook |
| Actions   | `useFetchMore` (data), in the hook                                                                                                                                                                                           |

## Hooks

| Hook                           | Args                       | Returns                  | Responsibility                                                                                                                        |
| ------------------------------ | -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `useVirtualListInfiniteScroll` | `{ rootRef, sentinelRef }` | `hasListEnd` (`boolean`) | Reads every observer input from the stores, applies the `shouldFetchToFill` and content-mode gates, calls `useInfiniteScrollObserver` |

## Sub-components

| Component                 | Location                     | Responsibility                                                                                                         |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `VirtualListBodyChildren` | `./VirtualListBodyChildren/` | Runs `useVirtualization` against `scrollContainerRef`; dispatches by `useGetContentMode` (skeleton / empty / list)     |
| `VirtualListBodyOptions`  | `./VirtualListBodyOptions/`  | Virtual scroll area layout, key generation, `VirtualizedOption` dispatch; window bounds arrive as producer→child props |
