# Routes Architecture

This directory contains the React Router route modules for the application.
`src/routes.ts` is the single route registry and each route folder owns its
loader, metadata, error boundary, and page component.

## Structure

- `root.ts` is the route entry point for an individual page.
- `layout.ts` re-exports the route layout and error boundary when a route uses a
  layout wrapper.
- Route-local implementation files follow the repo suffix conventions:
  `*.loader.ts`, `*.meta.ts`, `*.layout.tsx`, `*.errorBoundary.tsx`,
  `*.component.tsx`, `*.constants.ts`, `*.types.ts`, `*.util.ts`,
  `*.stylex.ts`.

## Shared Loader Utilities

- `utils/readTableLoaderStateFromRequest.util.ts` centralizes table loader
  bootstrap state (URL + cookie merge, standalone sort/filter params) used by
  table-backed routes.

## Wide All-Types Variants

- `/wide-alltypes-150` remains the baseline stress-test page backed by the
  shared `TableLayout`.

## Enterprise Orders Route

- `/enterprise-orders` uses a route-local constants map for column definitions,
  pinning defaults, and cell actions.
- See [enterprise-orders/ARCHITECTURE.md](enterprise-orders/ARCHITECTURE.md)
  for details.

## Routing Guardrails

- Keep route-specific experiments isolated in their own folders instead of
  swapping the implementation behind an existing URL.
- Prefer preserving the user-facing contract of an established route and adding
  a sibling route when comparing implementations side by side.
