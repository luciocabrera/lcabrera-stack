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

## Wide All-Types Variants

- `/wide-alltypes-150` remains the baseline stress-test page backed by the
  shared `TableLayout`.
- `/wide-alltypes-150-tanstack` is an isolated sibling experiment that reuses
  the same API contract with TanStack Table, TanStack Query, and TanStack
  Virtual.

## Routing Guardrails

- Keep route-specific experiments isolated in their own folders instead of
  swapping the implementation behind an existing URL.
- Prefer preserving the user-facing contract of an established route and adding
  a sibling route when comparing implementations side by side.
