# hooks/ Architecture

Table-specific hooks for column resizing, infinite scroll, and state persistence.

## File Structure

```
hooks/
├── persistCookieAction.constants.ts   → Cookie persistence action route constant
├── useColumnResize.hook.ts          → RAF-throttled drag resize
├── useHydrateTableSessionState.hook.ts → Restores tab-scoped table + UI state after mount
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

## useHydrateTableSessionState

Restores tab-scoped session state after mount and recomputes derived column slices
before committing to the main columns store.

```mermaid
graph TD
  ReadColumns["readPersistedStateFromSessionStorage"] --> Merge["merge persisted slices with current columns state"]
  Merge --> Derive["deriveColumnViewState\n(effectiveColumns, groups, offsets, normalizedColumns)"]
  Derive --> SetColumns["columnsStore.set(full hydrated state)"]

  ReadUi["readPersistedUiStateFromSessionStorage"] --> SetMeta["metaStore.set(ui state)"]
```

| Behavior          | Detail                                                                          |
| ----------------- | ------------------------------------------------------------------------------- |
| Scope             | Runs once after mount inside TableConfigProvider                                |
| Restored slices   | sorting, filters, order, pinning, sizing, visibility                            |
| Derived recompute | Rebuilds effectiveColumns, columnGroups, pinnedColumnOffsets, normalizedColumns |
| Static keys       | Recomputes staticKeys from current columns                                      |
| Guard             | No-op when persistenceKey is empty                                              |

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
