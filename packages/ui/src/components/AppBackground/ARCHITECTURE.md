# AppShell Architecture

## Purpose

The reusable app frame rendered inside `AppProviders`: themed background, `AppNavigation`, a routed `<Outlet />`, and `NotificationCenter`. Every consuming app renders the same shell; only the route tree behind `<Outlet />` differs per app.

## Public API

- `AppShell` — `getNavigationItems: (iconSize: number) => readonly ToolbarItemConfig[]`, forwarded straight to `AppNavigation` (each consuming app supplies its own — see `AppNavigation`'s own doc for why). Theme state comes from `useTheme()` (reads the `ThemeProvider` above it, supplied by `AppProviders`); routed content comes from React Router's own route tree via `<Outlet />`.

## Composition

- `useTheme()` → `isDarkMode`/`toggleTheme`, applied to the themed wrapper div (`darkTheme`/`lightTheme` StyleX theme objects) and passed to `AppNavigation`.
- `AppNavigation` — left/side navigation, receives the theme toggle and the `getNavigationItems` prop unchanged.
- `<Outlet />` — the app's own route tree renders here.
- `NotificationCenter` — renders outside the scrollable outlet area so toasts aren't clipped.

## File Structure

- `AppShell.component.tsx` — component implementation
- `AppShell.stylex.ts` — styles (background, overlay decoration, outlet scroll container)
- `AppShell.component.test.tsx` — tests
- `index.ts` — explicit barrel exports
