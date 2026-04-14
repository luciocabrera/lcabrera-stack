# RouteErrorBoundary Architecture

## Purpose

Reusable route-level error fallback UI for React Router data routes.

## Public API

- `RouteErrorBoundaryProps` (`RouteErrorBoundary.types.ts`)
  - `defaultMessage: string`
  - `error: unknown`

## Rendering Behavior

- Renders a static title, error details paragraph, and a retry button.
- In development mode, if `error` is an `Error`, the component shows `error.message`.
- In non-development mode, the component shows `defaultMessage`.

## Recovery Flow

- Retry button calls `globalThis.location.reload()` to trigger a full route reload.

## File Structure

- `RouteErrorBoundary.component.tsx` — component implementation
- `RouteErrorBoundary.types.ts` — public props contract
- `RouteErrorBoundary.stylex.ts` — styles
- `index.ts` — explicit barrel exports
