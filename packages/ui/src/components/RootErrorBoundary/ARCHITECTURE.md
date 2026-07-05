# RootErrorBoundary Architecture

## Purpose

Dependency-light top-level error fallback shared by every app's root
`ErrorBoundary` route export (`apps/*/src/root/Root.errorBoundary.tsx`).
Deduplicates the byte-identical scaffold each app previously inlined.

Distinct from `RouteErrorBoundary`: this is the **last-resort** boundary that
must render even when the app shell, providers, or compiled stylesheet failed
to load, so it uses only plain HTML — no router hooks, no StyleX, no shared UI
components.

## Public API

- `RootErrorBoundaryProps` (`RootErrorBoundary.types.ts`)
  - `error: unknown`

## Rendering Behavior

- Renders a static `Oops!` heading and a details paragraph.
- In development mode, if `error` is an `Error`, shows `error.message` and the
  stack (in a `<pre><code>` block).
- Otherwise shows a generic `An unexpected error occurred.` message.

## File Structure

- `RootErrorBoundary.component.tsx` — component implementation
- `RootErrorBoundary.types.ts` — public props contract
- `index.ts` — explicit barrel exports
