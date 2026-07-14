# VirtualListBody Architecture

Scroll-container owner (Table analog: `TableContent`): renders the scrollable viewport and the infinite-scroll sentinel. Filtering/selection/content state comes from the `contexts/` selectors; the derivation layer that used to live here (`resolveVirtualListBodyState`) now lives in `utils/resolveListDerivedState`, pre-computed into the data store.

## Responsibilities

- Own `scrollContainerRef` (viewport) and `sentinelRef` (1px sentinel) and the container styling (`listMaxHeight` / `shouldFillHeight` variants)
- Wire `useInfiniteScrollObserver`: `isEnabled` from `useGetHasMore` + `useGetIsLoadingOptions` + `useGetHasFetchMore`, `onReachEnd` from the `useFetchMore` action
- Delegate virtualization and content-mode dispatch to `VirtualListBodyChildren` (receives only `scrollContainerRef`, producer→direct-child)

The initial fetch effect lives in `VirtualListProvider`; the toggle/select-all handlers moved to the `useToggleOption`/`useToggleSelectAll` actions.

## Props

| Prop               | Type      | Description                        |
| ------------------ | --------- | ---------------------------------- |
| `listMaxHeight`    | `string`  | Max-height for non-fill mode       |
| `shouldFillHeight` | `boolean` | Uses fill-height container variant |

## Store Wiring

| Kind      | Hooks                                                                           |
| --------- | ------------------------------------------------------------------------------- |
| Selectors | `useGetHasMore`, `useGetIsLoadingOptions` (data), `useGetHasFetchMore` (config) |
| Actions   | `useFetchMore` (data)                                                           |

## Sub-components

| Component                 | Location                     | Responsibility                                                                                                         |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `VirtualListBodyChildren` | `./VirtualListBodyChildren/` | Runs `useVirtualization` against `scrollContainerRef`; dispatches by `useGetContentMode` (skeleton / empty / list)     |
| `VirtualListBodyOptions`  | `./VirtualListBodyOptions/`  | Virtual scroll area layout, key generation, `VirtualizedOption` dispatch; window bounds arrive as producer→child props |
