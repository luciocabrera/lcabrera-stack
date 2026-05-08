# Wide All-Types 150 TanStack Route Architecture

This route is a sibling experiment for the `wide_alltypes_150` dataset.
Unlike `/wide-alltypes-150`, which stays on the shared `TableLayout`, this
route intentionally uses TanStack Table, TanStack Query, and TanStack Virtual.

## Goals

- Keep the TanStack experiment isolated to its own route.
- Reuse the existing `wideAlltypes150Api` backend contract.
- Reuse the original wide-alltypes column contract instead of redefining the
  dataset schema.
- Support server-side sorting, infinite loading, and row virtualization.
- Preserve SSR by loading the first page in the route loader.

## Files

```text
wide-alltypes-150-tanstack/
├── ARCHITECTURE.md
├── WideAlltypes150TanStack.component.tsx
├── WideAlltypes150TanStack.constants.ts
├── WideAlltypes150TanStack.types.ts
├── wide-alltypes-150-tanstack.loader.ts
├── wide-alltypes-150-tanstack.meta.ts
├── wide-alltypes-150-tanstack.sorting.util.ts
├── wide-alltypes-150-tanstack.stylex.ts
├── wide-alltypes-150-tanstack.errorBoundary.tsx
├── wide-alltypes-150-tanstack.errorBoundary.stylex.ts
├── wide-alltypes-150-tanstack.layout.tsx
├── layout.ts
└── root.ts
```

## Data Flow

1. `wide-alltypes-150-tanstack.loader.ts` parses the optional `sort` search
   param and fetches the first page from the API.
2. `WideAlltypes150TanStack.component.tsx` creates a route-local
   `QueryClientProvider`.
3. The route uses `useInfiniteQuery` for additional pages keyed by sorting
   state.
4. `useReactTable` renders the server-backed rows.
5. `useColumnVirtualization` slices the visible horizontal window and uses
   spacer cells to preserve the full scroll width without rendering all 150
   columns at once.
6. `useVirtualizer` only renders the visible rows inside the scroll container
   using the fixed row-height estimate.

## Guardrails

- Sorting remains server-driven: the client never sorts already-fetched rows
  locally.
- Search-param sync is limited to sorting for sharable URLs.
- The TanStack stack is intentionally route-local so the rest of the app can
  continue using the custom table architecture unchanged.
- `useInfiniteQuery` results are treated as nullable during key transitions and
  initial loads; table rows derive from an empty pages fallback until query data
  is available.
- The route-local `QueryClient` is cleared on unmount to prevent stale
  background work after navigating away from the route.
- Table sorting handlers are wired through `useReactTable` options instead of
  mutating `table.setOptions` during render, keeping behavior safe under
  concurrent transitions.
- Query errors are handled in-route: initial-load failures render an inline
  error state, and background pagination failures are surfaced in the footer
  without crashing navigation.
