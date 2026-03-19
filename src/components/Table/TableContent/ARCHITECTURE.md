# TableContent Architecture

Main layout component that assembles the table UI: title bar, scrollable
table container with header/body, infinite scroll, and settings drawers.
Also provides the `TableWrapperContext` with a ref to the wrapper element.

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
```

## Context & Hooks

```mermaid
graph LR
  subgraph "Reads"
    TC["TableContent"] --> threshold["useGetTableThreshold()"]
    TC --> isLoadingMore["useGetTableIsLoadingMore()"]
    TC --> hasMore["useGetTableHasMore()"]
  end

  subgraph "Actions"
    TC --> fetchMore["useFetchMoreData()"]
    TC --> toggleSettings["useToogleTableIsTableSettingsOpen()"]
  end

  subgraph "Hooks"
    TC --> scroll["useInfiniteScroll(containerRef, threshold, ...)"]
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
