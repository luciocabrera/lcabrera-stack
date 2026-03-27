# ADR-006: Infinite Scroll Prefetch Buffer

**Status:** Accepted

## Context

The Table component uses infinite scroll to load paginated data. When the user scrolls near the bottom (within `threshold` px), `useFetchMoreData` fires a network request. The user must wait for the response before seeing new rows. For pages with higher latency, this creates a visible pause between scroll and data appearance.

Three approaches were evaluated:

1. **Larger page size** — fetch 100 rows instead of 50. Simpler, but inflexible and doubles payload regardless of need.
2. **Prefetch buffer** — after each load-more completes, silently fetch the next page in the background. On next scroll, consume the cached data instantly.
3. **Web Worker for fetch/parse** — offload `fetch()` + JSON parsing to a Worker thread. Evaluated and rejected (see below).

## Decision

Implement a **ref-based prefetch buffer** in `useFetchMoreData`, controlled by an opt-in `enablePrefetch` prop on `TableLayout`. Also make `loadMorePageSize` configurable.

### Key Design Choices

- **Opt-in via `enablePrefetch`** (default `true`) — zero behavior change for existing consumers.
- **Ref-based cache** (not store-based) — prefetched data is an invisible cache that should not trigger re-renders.
- **Uses existing `onLoadMore` callback** — the prefetch calls the same callback provided by the route. This keeps the interface Worker-ready: swapping `onLoadMore` to delegate to a Worker later changes nothing in the hook.
- **Direct data append** — `dataStore.set()` is called synchronously (no `startTransition`) so new rows render immediately after fetch, minimizing visible gaps during fast scroll.
- **Natural cache invalidation** — when sort/filter changes reset data, `currentData.length` becomes 0 and `prefetchRef.skip` won't match, automatically discarding stale cache.

### Cache States

| `prefetchRef` state                                  | Behavior                                          |
| ---------------------------------------------------- | ------------------------------------------------- |
| `skip` matches expected, `data` exists               | **Cache HIT** — use data directly, skip network   |
| `skip` matches expected, `promise` exists, no `data` | **In-flight** — await the already-started promise |
| `skip` doesn't match or cache empty                  | **Cache MISS** — normal `onLoadMore()` call       |

### Worker Assessment (rejected for now)

- `fetch()` is already non-blocking — runs off main thread natively.
- JSON parsing for 50–100 row pages takes ~1–2ms — well under the 16ms frame budget.
- Worker structured clone serialization to transfer data back costs more than the parsing it saves.
- SSR incompatible (client-only), requires TypeScript `webworker` lib + Vite worker config.
- **Threshold for reconsideration**: when page sizes reach 10K+ rows or JSON parsing exceeds 30ms, revisit Worker strategy. The `onLoadMore` callback is the natural seam — swap it to delegate to a Worker without changing any hook code.

## Consequences

- `useFetchMoreData` is slightly more complex (prefetch ref, cache check logic, background promise).
- One additional network request fires after each load-more when prefetch is enabled.
- Failed prefetches are silently discarded — the next scroll trigger falls back to a normal fetch.
- `loadMorePageSize` and `enablePrefetch` are stored in `metaStore` and accessible via selectors, consistent with all other table configuration.
