# AppProviders Architecture

## Purpose

Composes the three app-wide providers (theme, global settings, notifications) every consuming app needs, in the required nesting order, so that order is defined once rather than re-copied per app root.

## Public API

- `AppProvidersProps` (`AppProviders.types.ts`)
  - `children: ReactNode`
  - `defaultTheme?: ThemeMode` — default is `'light'`
  - `initialTheme?: ThemeMode` — SSR-derived value from the route's loader; takes priority over `defaultTheme`
  - `globalSettings?: GlobalSettingsState` — SSR-derived value from the route's loader

## Composition

```
ThemeProvider(defaultTheme, initialTheme)
  GlobalSettingsProvider(initialSettings=globalSettings)
    NotificationProvider
      children
```

The route (e.g. `root.loader.ts`) is responsible for fetching `theme`/`globalSettings` and passing them as props — this component owns provider composition only, not data fetching.

## File Structure

- `AppProviders.component.tsx` — provider composition
- `AppProviders.types.ts` — public props contract
- `AppProviders.component.test.tsx` — tests
- `index.ts` — explicit barrel exports
