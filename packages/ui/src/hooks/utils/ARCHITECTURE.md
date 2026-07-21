# hooks/utils Architecture

Helper utilities used by hook implementations. Includes pure functions (search, calculations) and side-effect utilities (ResizeObserver wiring).

## File Structure

```
hooks/utils/
├── ARCHITECTURE.md                   -> This overview
├── setupObservedContainer.util.ts    -> Shared ResizeObserver + RAF-batched scroll wiring
├── getVerticalVirtualizationWindow.util.ts -> Shared vertical virtualization window calculation
├── index.ts                          -> Barrel exports for hook-local utils
```

## Utilities

| Utility                           | Description                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `setupObservedContainer`          | Attaches ResizeObserver (skipped when unavailable) + passive scroll listener with RAF-batched scroll updates |
| `getVerticalVirtualizationWindow` | Returns `startIndex`, `endIndex`, spacers, and totals for fixed-height row virtualization                    |

## Consumers

- `src/hooks/useVirtualization.hook.ts` — computes the vertical row window
