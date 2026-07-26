---
'@lcabrera/ui': minor
---

Add `RootComponent` — the whole root route of a consuming app in one component.
It reads the root loader's data, composes `AppProviders` and renders `AppShell`,
so an app supplies only what genuinely depends on the app: `appId`,
`defaultTheme`, `getNavigationItems`, `isAuthEnabled` and an optional
`logoutRoute`. Same reasoning as `hydrateApp` and `createHandleRequest` one layer
down — the root was the last seam every app had to reproduce correctly before
the shell would work at all.

**Breaking:** the navigation subtree no longer drills consumer configuration
through components that never read it. `AppShell` and `AppNavigation` lose
`getNavigationItems` and `sessionActions`, and the `NavigationSessionActions`
render-prop type is gone. Both values now travel through the new
`AppConfigContext` (`@lcabrera/ui/contexts/AppConfigContext`), which also carries
`isAuthEnabled` and `logoutRoute`.

Migrating a hand-composed root — either adopt `RootComponent`, or wrap the shell:

```tsx
<AppConfigProvider
  getNavigationItems={getNavigationItems}
  isAuthEnabled
  logoutRoute='/logout'
>
  <AppProviders appId={APP_ID}>
    <AppShell />
  </AppProviders>
</AppConfigProvider>
```

The session control now ships with the package. An app that passes
`isAuthEnabled` gets a logout control in the navigation footer, POSTing a
`<Form>` to `logoutRoute` (default `/logout`) — it no longer has to write one and
pass it in. It also picks up the navigation's density preference, which the
hand-written controls did not.

`AppConfigContext` carries a plain value rather than a store: none of it changes
for the lifetime of the app, so there is nothing to subscribe to. See ADR-053.
