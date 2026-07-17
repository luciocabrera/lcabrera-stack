# AppShell Architecture

## Purpose

The reusable app frame rendered inside `AppProviders`: themed background, `AppNavigation`, a routed `<Outlet />` inside the `<main>` landmark, and `NotificationCenter`. Every consuming app renders the same shell; only the route tree behind `<Outlet />` differs per app.

## Public API

- `AppShell` — `getNavigationItems: (iconSize: number) => readonly ToolbarItemConfig[]`, forwarded straight to `AppNavigation` (each consuming app supplies its own — see `AppNavigation`'s own doc for why). Theme state comes from `useTheme()` (reads the `ThemeProvider` above it, supplied by `AppProviders`); routed content comes from React Router's own route tree via `<Outlet />`.

## Composition

- `useTheme()` → `isDarkMode`/`toggleTheme`, applied to the themed wrapper div (`darkTheme`/`lightTheme` StyleX theme objects) and passed to `AppNavigation`.
- `AppNavigation` — left/side navigation, receives the theme toggle and the `getNavigationItems` prop unchanged.
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
