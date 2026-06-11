# hooks/utils Architecture

Pure helper utilities used by hook implementations.

## File Structure

```
hooks/utils/
├── ARCHITECTURE.md                   -> This overview
├── setupObservedContainer.util.ts    -> Shared ResizeObserver + RAF-batched scroll wiring
├── getVerticalVirtualizationWindow.util.ts -> Shared vertical virtualization window calculation
├── index.ts                          -> Barrel exports for hook-local utils
├── findFirstOutOfViewIndex.util.ts   -> Binary search: first start >= viewport end
└── findFirstVisibleIndex.util.ts     -> Binary search: first column right-edge > viewport start
```

## Utilities

| Utility                           | Description                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `findFirstVisibleIndex`           | Returns first index whose `starts[i] + widths[i]` exceeds `viewStart`                     |
| `findFirstOutOfViewIndex`         | Returns first index whose `starts[i]` is greater than or equal to `viewEnd`               |
| `setupObservedContainer`          | Attaches ResizeObserver + passive scroll listener with RAF-batched scroll updates         |
| `getVerticalVirtualizationWindow` | Returns `startIndex`, `endIndex`, spacers, and totals for fixed-height row virtualization |

## Consumers

- `src/hooks/useColumnVirtualization.hook.ts` — resolves visible horizontal window boundaries
- `src/hooks/useVirtualization.hook.ts` — computes default vertical row window
- `src/hooks/useVirtualizationResizeObserver.hook.ts` — computes ResizeObserver/RAF vertical row window
