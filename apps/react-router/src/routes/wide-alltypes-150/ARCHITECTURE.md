# Wide Alltypes 150 Route Architecture

This route is the baseline stress-test page for the `wide_alltypes_150`
dataset. It stays on the shared `TableLayout` architecture used elsewhere in
the app and acts as the reference implementation for the same dataset.

## Goals

- Reuse the existing `/wide-alltypes-150/paginated` backend contract.
- Preserve the shared table feature set: persistence, URL state, sorting, and
  infinite loading.
- Keep the established `/wide-alltypes-150` route stable while sibling
  experiments can live on separate URLs.

## Files

```text
wide-alltypes-150/
├── ARCHITECTURE.md
├── WideAlltypes150.component.tsx
├── WideAlltypes150.constants.ts
├── wide-alltypes-150.loader.ts
├── wide-alltypes-150.meta.ts
├── WideAlltypes150.error-boundary.tsx
├── WideAlltypes150.layout.tsx
├── WideAlltypes150.component.tsx
├── WideAlltypes150.constants.ts
├── layout.ts
└── root.ts
```

## Data Flow

1. `wide-alltypes-150.loader.ts` restores persisted table state from URL params
   and cookies into loader-seeded `columnsState` and `metaState`. `COLUMNS`
   is fully serializable (no functions — ADR-009), so the loader returns it
   directly inside `columnsState`; no distinct filter descriptors are
   appended here yet (this route's filter support is deliberately minimal).
2. The loader fetches the first page through `fetchWideAlltypes150Page`.
3. `WideAlltypes150.component.tsx` renders `TableRouteView`, which reads the
   loader-seeded state and wires load-more to the same fetcher. The loader
   declares neither `isKeysetEnabled` nor `isServerFilterEnabled` on its `meta`
   — this endpoint supports neither, and absent means off (ADR-063), so the
   load-more carries `limit`, `skip` and `sort` only.
4. `TableLayout`, beneath it, owns rendering, persistence, sorting, and
   incremental loading.

## Guardrails

- Keep this route on the shared table stack so it remains the baseline for
  comparisons.
- Reuse the original column configuration and persistence key.
- Add experimental table implementations as sibling routes instead of replacing
  this URL.
- Generated columns are filterable by default except `Bytea`, `Point`, and
  `Int[]` columns to keep filter option fetching practical.
