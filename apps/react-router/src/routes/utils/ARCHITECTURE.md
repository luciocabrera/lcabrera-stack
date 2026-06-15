# routes/utils Architecture

Shared route-level loader utilities.

## Purpose

- Reduce duplication across route loaders that reconstruct table state from URL + cookie sources.
- Keep loader files focused on route-specific API calls.

## Current Utilities

- `readTableLoaderStateFromRequest.util.ts` - Reads table state for SSR loaders from URL params and persisted cookies.

### `readTableLoaderStateFromRequest.util.ts`

- Rebuilds table state from URL params plus persisted cookie state for SSR loaders.
- When loaders provide route column metadata, standalone `filters` params are sanitized against each column's declared `dataType` before the API layer receives them.
- Unknown column keys and mismatched filter kinds (for example numeric operators on string columns) are dropped at this boundary.

## Guardrails

- URL standalone params (`sort`, `filters`) remain the source of truth for sorting/filtering.
- URL state has priority over cookie state for merged slices.
- Route loaders can opt into column-aware sanitization by passing their column definitions when they consume standalone filters.
- Utility must remain route-loader oriented and free of side effects.
