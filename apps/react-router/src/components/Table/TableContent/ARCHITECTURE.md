# TableContent Architecture

Main layout component that assembles the table UI: title bar, scrollable
table container with header/body, infinite scroll, and settings drawers.
Also provides the `TableWrapperContext` with a ref to the wrapper element.
The scroll container can be scroll-locked during the initial loading state,
while header/body cells keep rendering the per-cell shimmer overlay.

## File Structure

```
TableContent/
├── TableContent.component.tsx   → Layout: Title + scroll container + drawers
├── TableContent.types.ts        → TableContentProps (picks from TableProps)
├── TableContent.stylex.ts       → Wrapper, outer container, scroll container
└── index.ts                     → Barrel export
```

## Render Structure

```mermaid
graph TD
  TC["TableContent"] --> TWC["TableWrapperContext.Provider"]
  TWC --> Wrapper["div (wrapperRef)"]

  Wrapper --> Outer["div (outerContainer)"]
  Wrapper --> Drawers["TableDrawersSection"]

  Outer --> Title["TableTitle"]
  Title --> Actions["Settings button + user actions"]
  Outer --> Scroll["div (containerRef · scroll area)"]

  Scroll --> TB["TableBase"]
  TB --> TH["TableHeader"]
  TB --> TBody["TableBody"]
  Scroll --> Sentinel["div (sentinelRef · infinite-scroll sentinel)"]
```

> The sentinel uses `position: sticky; left: 0` so it stays inside the
> horizontal viewport at every `scrollLeft`. `IntersectionObserver` requires
> overlap on both axes — a normal block sentinel is only viewport-wide and
> anchored left, so scrolling the wide table fully right would move it out of
> view and silently stop fetch-more. Sticky-pinning keeps vertical
> bottom-detection working regardless of horizontal scroll.

## Context & Hooks

```mermaid
graph LR
  subgraph "Reads"
    TC["TableContent"] --> threshold["useGetTableThreshold()"]
    TC --> isLoading["useGetTableIsLoading()"]
    TC --> isLoadingMore["useGetTableIsLoadingMore()"]
    TC --> hasMore["useGetTableHasMore()"]
  end

  subgraph "Actions"
    TC --> fetchMore["useFetchMoreData()"]
    TC --> toggleSettings["useToogleTableIsTableSettingsOpen()"]
  end

  subgraph "Hooks"
    TC --> scroll["useInfiniteScroll(containerRef, sentinelRef, threshold, ...)"]
  end

  subgraph "Provides"
    TC --> wrapperCtx["TableWrapperContext { wrapperRef }"]
  end
```

## Refs

| Ref            | Element        | Purpose                                    |
| -------------- | -------------- | ------------------------------------------ |
| `containerRef` | Scroll `<div>` | Infinite scroll detection + virtualization |
| `wrapperRef`   | Outer `<div>`  | Provided via `TableWrapperContext`         |

## Infinite Scroll

The `useInfiniteScroll` hook monitors `containerRef` scroll position.
When the user scrolls within `threshold` pixels of the bottom and
`hasMore` is true, it calls `fetchMoreData()` which appends the next
page to `dataStore`.

## Scroll Lock

`TableContent` disables scrolling only during the initial `isLoading` state so
the user keeps the previous data + skeleton presentation without being able to
scroll through an empty loading surface.

When a query transition completes (`isLoading` goes from `true` to `false`),
the scroll container is reset to top. This is intentionally different from
infinite-scroll load-more transitions (`isLoadingMore`), which preserve the
current scroll position.
