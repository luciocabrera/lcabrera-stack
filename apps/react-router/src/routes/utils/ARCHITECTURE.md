# routes/utils Architecture

Shared route-level loader utilities.

## Purpose

- Reduce duplication across route loaders that reconstruct table state from URL + cookie sources.
- Keep loader files focused on route-specific API calls.

## Current Utilities

- `readTableLoaderStateFromRequest.util.ts` - Reads table state for SSR loaders from URL params and persisted cookies.
- `sanitizeSorting.util.ts` - Removes undefined-direction and `'actions'`-key entries from a `SortingState` before passing to API calls. Used by all table route loaders.
- `shouldRevalidatePersistCookieAction.util.ts` - Skips loader revalidation for `persist-cookie` action responses with `204` status.

### `readTableLoaderStateFromRequest.util.ts`

- Rebuilds table state from URL params plus persisted cookie state for SSR loaders.
- When loaders provide route column metadata, standalone `filters` params are sanitized against each column's declared `dataType` before the API layer receives them.
- Unknown column keys and mismatched filter kinds (for example numeric operators on string columns) are dropped at this boundary.

### `shouldRevalidatePersistCookieAction.util.ts`

- Shared `shouldRevalidate` guard for table-backed routes.
- Returns `false` when the submitting action is `/_action/persist-cookie` and
  the action status is `204` (cookie persisted but no effective query change).
- Defers to `defaultShouldRevalidate` for all other cases, including redirects
  caused by effective sort/filter URL changes.

## Guardrails

- URL standalone params (`sort`, `filters`) remain the source of truth for sorting/filtering.
- URL state has priority over cookie state for merged slices.
- Route loaders can opt into column-aware sanitization by passing their column definitions when they consume standalone filters.
- Utility must remain route-loader oriented and free of side effects.
