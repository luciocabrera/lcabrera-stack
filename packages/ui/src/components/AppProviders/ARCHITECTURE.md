# AppProviders Architecture

## Purpose

Composes the three app-wide providers (theme, global settings, notifications) every consuming app needs, in the required nesting order, and seeds them from the root loader — so both the order and the loader read are defined once rather than re-copied per app root.

## Public API

- `AppProvidersProps` (`AppProviders.types.ts`)
  - `appId?: string` — per-app id used to scope the theme / global-settings cookies (cookies are shared across ports on the same host, so each app must pass a distinct id)
  - `children: ReactNode`
  - `defaultTheme?: ThemeMode` — theme to use when the root loader supplies none; default is `'light'`

`AppProvidersLoaderData` is the minimal subset of the root loader's data this
component reads (`globalSettings`, `theme`). It is declared here rather than
imported from an app's generated loader type, because that type is app-specific
and this component is not — the same call `AppDocument` makes for `rootData`.
`getRootLoaderData` (`@lcabrera/ui/routing/shared`) returns a superset of it, so
an app whose root loader delegates to that helper satisfies it by construction.

## Composition

```
useLoaderData → { theme, globalSettings }
ThemeProvider(appId, defaultTheme, initialTheme=theme)
  GlobalSettingsProvider(appId, initialSettings=globalSettings)
    NotificationProvider
      children
```

The SSR-derived values are read here rather than taken as props: this is their
only consumer, so a parent that read them would exist only to name them again —
`PATTERNS.md` §"Thin Shell + Self-Connected Delegates". `useLoaderData` returns
`undefined` for a route with no loader, so an app without one degrades to
`defaultTheme` instead of failing.

Fetching stays the route's job — this component reads what the loader already
returned, it does not fetch.

## File Structure

- `AppProviders.component.tsx` — the loader read and the provider composition
- `AppProviders.types.ts` — public props contract and the loader-data subset
- `AppProviders.component.test.tsx` — tests
- `index.ts` — explicit barrel exports
