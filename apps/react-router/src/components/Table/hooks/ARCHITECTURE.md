# hooks/ Architecture

Table-specific hooks for column resizing, infinite scroll, and state persistence.

## File Structure

```
hooks/
├── useColumnResize.hook.ts          → RAF-throttled drag resize
├── useInfiniteScroll.hook.ts        → Scroll threshold detection
├── usePersistCookieAction.hook.ts   → Server action cookie persistence
└── index.ts                         → Barrel export
```

## useColumnResize

RAF-throttled mouse drag handler for column width adjustment.

```mermaid
graph LR
  MD["onMouseDown"] --> Track["Track initialX + initialWidth"]
  Track --> Move["document.onMouseMove"]
  Move --> RAF["requestAnimationFrame"]
  RAF --> Clamp["clamp(min, max, initialWidth + delta)"]
  Clamp --> Resize["onResize({ columnKey, width })"]
  Move --> Up["document.onMouseUp"]
  Up --> Sync["useSyncColumnsSizing()"]
```

| Feature              | Detail                                 |
| -------------------- | -------------------------------------- |
| Throttling           | `requestAnimationFrame` per move event |
| Constraints          | `minWidth` / `maxWidth` clamping       |
| Double-click         | Resets column to auto width            |
| Selection prevention | Disables text selection during drag    |
| Cleanup              | Global mouse listeners on document     |

## useInfiniteScroll

Monitors a scroll container and triggers data fetching when near bottom.

```mermaid
graph LR
  Scroll["container.onScroll"] --> Check{"distanceFromBottom <= threshold?"}
  Check -->|"Yes + hasMore + !isLoadingMore"| Fetch["fetchMoreData()"]
  Check -->|No| Noop["(no-op)"]
```

| Param                       | Purpose                               |
| --------------------------- | ------------------------------------- |
| `scrollContainerRef`        | Element to watch scroll events on     |
| `threshold`                 | Pixel distance from bottom to trigger |
| `hasMore` / `isLoadingMore` | Guard against duplicate fetches       |
| `fetchMoreData`             | Async function to append next page    |

## usePersistTableStateAction

Persists table state slices to cookies via a server action (React Router `useFetcher`).

```mermaid
graph TD
  Action["persistTableState(entries)"] --> Serialize["serializeStateSlice per entry"]
  Serialize --> Submit["fetcher.submit({ entries, currentUrl })"]
  Submit --> Route["POST /_action/persist-cookie"]
  Route --> Cookie["Set-Cookie response header"]
```

Supports both single entries and batch submissions. Each entry specifies:

- `persistenceKey` — cookie name namespace
- `slice` — which state slice (columnFilters, sorting, etc.)
- `valueSlice` — the data to persist
- `searchParamKey/Value` — optional URL search param sync
