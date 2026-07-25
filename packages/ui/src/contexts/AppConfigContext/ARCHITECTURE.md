# AppConfigContext Architecture

## Purpose

Publishes the configuration a consuming app supplies once, at mount, to the
whole shell — so the navigation subtree stops being a pipe. Before this, an
app's route links and its session slot travelled `Root` → `AppShell` →
`AppNavigation` → the delegate that finally read them, and three components in
between declared props they never used.

Rationale and alternatives: [ADR-053](../../../../../docs/decisions/ADR-053-package-owned-app-root-and-app-config-context.md).

## Why a value, not a store

None of this changes for the lifetime of the app, so there is nothing to
subscribe to and `useSyncExternalStore` would buy nothing but machinery.
`TableWrapperContext` is the same shape for the same reason. Anything here that
does start changing belongs in a store instead — that is the line, and it is the
one `GlobalSettingsContext` sits on the other side of.

## Context Value

| Field                | Type                 | Default   | Read by                                     |
| -------------------- | -------------------- | --------- | ------------------------------------------- |
| `getNavigationItems` | `GetNavigationItems` | —         | `NavigationBody`                            |
| `isAuthEnabled`      | `boolean`            | `false`   | `NavigationFooter`                          |
| `logoutRoute`        | `string`             | `/logout` | `NavigationFooter/NavigationSessionActions` |

`DEFAULT_LOGOUT_ROUTE` is a default rather than a constant the components read
directly: a published package cannot assume a consumer's route table, and an app
mounting logout elsewhere would otherwise be unable to use the shell at all.

## Selectors

One-liners over `useAppConfigContextValue`, one per field, so a delegate imports
exactly what it reads:

- `useGetAppNavigationItems`
- `useGetIsAuthEnabled`
- `useGetAppLogoutRoute`

`useAppConfigContextValue` throws when read outside `AppConfigProvider`, so a
missing provider names its own fix instead of surfacing as `undefined` deeper in
the tree.

## File Structure

```
AppConfigContext/
├── AppConfigContext.constants.ts        → DEFAULT_LOGOUT_ROUTE
├── AppConfigContext.context.ts          → createContext + displayName
├── AppConfigContext.provider.tsx        → AppConfigProvider (applies the defaults)
├── AppConfigContext.provider.test.tsx   → provider + selector tests
├── AppConfigContext.types.ts            → value, provider props, GetNavigationItems
├── useAppConfigContextValue.hook.ts     → guarded context read
├── useAppConfigContextValue.hook.test.ts
├── selectors/                           → one hook per field
└── index.ts                             → AppConfigProvider
```

## Provided By

`RootComponent` mounts the provider for apps using the assembled root. An app
composing the shell by hand mounts `AppConfigProvider` itself, above
`AppShell` — `AppShell` and `AppNavigation` both read from it.
