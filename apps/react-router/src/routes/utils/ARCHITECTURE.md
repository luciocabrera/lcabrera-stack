# routes/utils Architecture

Shared route-level loader utilities.

## Purpose

- Reduce duplication across route loaders that reconstruct table state from URL + cookie sources.
- Keep loader files focused on route-specific API calls.

## Current Utilities

- `readTableLoaderStateFromRequest.util.ts` - Reads table state for SSR loaders from URL params and persisted cookies.

## Guardrails

- URL standalone params (`sort`, `filters`) remain the source of truth for sorting/filtering.
- URL state has priority over cookie state for merged slices.
- Utility must remain route-loader oriented and free of side effects.
