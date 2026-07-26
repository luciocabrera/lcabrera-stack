---
'@lcabrera/ui': minor
---

**Breaking:** `AppProviders` reads the root loader's `theme` and `globalSettings`
itself, and loses the `initialTheme` and `globalSettings` props that used to
carry them. It is the only component that consumed those values, so a caller
reading them existed purely to name them again — the same call
`PATTERNS.md` §"Thin Shell + Self-Connected Delegates" makes everywhere else in
the package.

Nothing changes for an app on `RootComponent`, which is where this seam lived.
A hand-composed root drops the two props:

```tsx
// before
<AppProviders appId={APP_ID} globalSettings={globalSettings} initialTheme={theme}>

// after — AppProviders reads both from the root loader
<AppProviders appId={APP_ID}>
```

`useLoaderData` returns `undefined` for a route with no loader, so a root route
without one still falls back to `defaultTheme` rather than failing. The loader's
shape is unchanged: `getRootLoaderData` (`@lcabrera/ui/routing/shared`) already
returns a superset of what is read.

The type describing that shape moved with the read and was renamed to match its
new owner — `RootComponentLoaderData`
(`@lcabrera/ui/components/RootComponent/RootComponent.types`) is now
`AppProvidersLoaderData`
(`@lcabrera/ui/components/AppProviders/AppProviders.types`). Neither name is
exported from the package root.
