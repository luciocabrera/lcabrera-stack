# Wide Alltypes 150 Route Architecture

This route is the baseline stress-test page for the `wide_alltypes_150`
dataset. It stays on the shared `TableLayout` architecture used elsewhere in
the app and acts as the reference implementation for the same dataset.

## Goals

- Reuse the existing `wideAlltypes150Api` backend contract.
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
├── wide-alltypes-150.errorBoundary.tsx
├── wide-alltypes-150.errorBoundary.stylex.ts
├── wide-alltypes-150.layout.tsx
├── layout.ts
└── root.ts
```

## Data Flow

1. `wide-alltypes-150.loader.ts` restores persisted table state from URL params
   and cookies, then the `clientLoader` combines it into loader-seeded
   `columnsState` and `metaState`.
2. The loader fetches the first page from `wideAlltypes150Api`.
3. `WideAlltypes150.component.tsx` passes the dataset contract and loader-seeded
   initial state into `TableLayout`.
4. `TableLayout` owns rendering, persistence, sorting, and incremental loading.

## Guardrails

- Keep this route on the shared table stack so it remains the baseline for
  comparisons.
- Reuse the original column configuration and persistence key.
- Add experimental table implementations as sibling routes instead of replacing
  this URL.
- Generated columns are filterable by default except `Bytea`, `Point`, and
  `Int[]` columns to keep filter option fetching practical.
