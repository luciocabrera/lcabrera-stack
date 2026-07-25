# AppShell Architecture

## Purpose

The reusable app frame rendered inside `AppProviders`: themed background, `AppNavigation`, a routed `<Outlet />` inside the `<main>` landmark, and `NotificationCenter`. Every consuming app renders the same shell; only the route tree behind `<Outlet />` differs per app.

## Public API

`AppShell` takes **no props**. Everything app-specific reaches the delegate that
renders it through `AppConfigContext` — the app's route links, whether it has a
session, and where its session controls POST ([ADR-053](../../../../../docs/decisions/ADR-053-package-owned-app-root-and-app-config-context.md)).
Theme state comes from the `ThemeProvider` above it (supplied by
`AppProviders`), and routed content from React Router's own route tree via
`<Outlet />`.

It therefore requires two providers above it: `AppConfigProvider` and
`AppProviders`. `RootComponent` mounts both; an app composing the shell by hand
mounts them itself.

## Composition

- `AppNavigation` — left/side navigation. Zero props: its body and footer read
  their own configuration and preferences.
- `<main>` — the document's single `main` landmark, wrapping `<Outlet />`. It lives here rather than in `AppDotted` because `AppDotted` is also reused by `Modal`, which would emit a second `main` per open modal and break `landmark-one-main`. The root `ErrorBoundary` path renders `RootErrorBoundary`'s own `<main>` _instead of_ `AppShell`, so the two never coexist.
- `<Outlet />` — the app's own route tree renders here.
- `NotificationCenter` — renders outside the scrollable outlet area so toasts aren't clipped.

## Layout Constraints

`<main>` sits between `AppDotted` (the column flex scroll container) and routed content, so it must stay layout-transparent. It is `display: flex` / `flex-direction: column` / `flex: 1 1 auto` / `min-height: 0`: the `flex: 1 1 auto` + `min-height: 0` pair is what gives it a **definite** height in `AppDotted`'s column flex box. Routes such as `TableLayout` size themselves with `height: 100%`, which resolves against `main`; drop the flex sizing and that percentage falls back to `auto`, collapsing the table's scroll container.

## File Structure

- `AppShell.component.tsx` — component implementation
- `AppShell.stylex.ts` — styles (the `main` landmark's layout-transparent flex sizing)
- `AppShell.component.test.tsx` — tests
- `index.ts` — explicit barrel exports
