# ADR-053 — The app root is package-owned, and consumer configuration travels by context

- **Status:** Accepted
- **Date:** 2026-07-25
- **Issue:** [#436](https://github.com/luciocabrera/vite-react-compiler/issues/436)
- **Relates to:** [ADR-007](../../apps/showcase/docs/decisions/ADR-007-barrel-export-boundaries.md) (barrel boundaries for private delegates), [ADR-038](ADR-038-public-package-topology-by-runtime.md) (what a published package may depend on), [ADR-046](ADR-046-public-api-surface-snapshot.md) (the surface this adds to).

## Context

Every consuming app hand-assembled its own root route. Each imported
`AppProviders` and `AppShell`, called
`useLoaderData` for the root loader, and threaded the same four values through
in the same order. Only three of those inputs actually differ per app: the app
id, the default theme, and the navigation items.

That is the shape `hydrateApp` and `createHandleRequest` already removed one
layer down — `entry.client.tsx` is three lines and `entry.server.tsx` is one
call. The root was the remaining seam an app had to reproduce correctly before
the shell would work at all, and a mistake in it fails at runtime rather than at
typecheck.

Underneath, the navigation subtree was a pipe. `getNavigationItems` travelled
`Root` → `AppShell` → `AppNavigation` → `NavigationBody`, read only by the last
one. `sessionActions` travelled the same path as a render-prop, so every
authenticated app had to write its own logout control and remember to pass it.
`AppNavigation` called `useTheme()` purely to forward two values into
`NavigationFooter`. Three components in that chain declared props they never
used — the exact smell `PATTERNS.md` §"Thin Shell + Self-Connected Delegates"
bans, one level up from where it had previously been applied.

## Decision

**1. `@lcabrera/ui` exports `RootComponent`, and it is the whole root route.**
It reads the root loader's data, composes `AppProviders`, and renders
`AppShell`. An app supplies `appId`, `defaultTheme`, `getNavigationItems`,
`isAuthEnabled` and an optional `logoutRoute` — the inputs that genuinely depend
on the consumer — and nothing else.

It types the loader data as its own minimal `RootComponentLoaderData` rather
than importing an app's generated loader type, the same way `AppDocument` types
`rootData`. `getRootLoaderData` returns a superset of it, so any app whose root
loader delegates to that helper satisfies it by construction, and an app with no
root loader at all degrades to the declared defaults instead of crashing.

> **Amended by [#440](https://github.com/luciocabrera/vite-react-compiler/issues/440).**
> The loader read moved down to `AppProviders`, the only component that consumed
> `theme`/`globalSettings`, and the type moved and was renamed with it
> (`AppProvidersLoaderData`). `RootComponent` is still the whole root route and
> an app still supplies the same five inputs; what changed is that the two
> SSR-derived values are no longer drilled one level, which is rule 2 of
> `PATTERNS.md` §"Thin Shell + Self-Connected Delegates" applied to the same
> chain this ADR shortened.

**2. Consumer configuration reaches its reader through `AppConfigContext`, not
through props.** The context carries `getNavigationItems`, `isAuthEnabled` and
`logoutRoute`. `AppShell` and `AppNavigation` take no navigation or session
props; `NavigationBody` reads the items it renders, and the navigation footer's
delegates read the logout route and the collapsed/density preferences they
render with.

The alternative — keep drilling — costs a prop on every component in the chain
for each new piece of app configuration, and the chain is four deep. The context
is declared once at the root and read where it is used.

**3. It is a plain `use()` context, not a store.** None of it changes for the
lifetime of the app, so there is nothing to subscribe to and
`useSyncExternalStore` would buy nothing. This follows `TableWrapperContext`,
which is the same shape for the same reason: `createContext<T | undefined>`,
one-liner accessor hooks, and a throw when read outside the provider.

**4. The session control ships with the package, gated on a boolean.** The
logout control moved out of `apps/react-router` and became
`NavigationSessionActions`, a private footer delegate rendered only when the app
declared `isAuthEnabled`. It was already generic apart from the route it POSTs
to, so that route became the `logoutRoute` config field — hard-coding `/logout`
inside a published package would make the component unusable by an app that
mounts logout anywhere else.

## Consequences

- **Breaking, for the four published packages' consumers.** `AppShell` and
  `AppNavigation` lose `getNavigationItems` and `sessionActions`, and the
  `NavigationSessionActions` render-prop type is gone. A consumer composing the
  shell by hand now wraps it in `AppConfigProvider`
  (`@lcabrera/ui/contexts/AppConfigContext`). Carried by a changeset and by the
  `reports/api-surface/ui.txt` snapshot ADR-046 gates.
- **`AppShell` and `AppNavigation` now require a provider above them.** They
  already required `GlobalSettingsContext`, so this adds a second ambient
  dependency rather than a first. The accessor hook throws with the provider's
  name, so the failure names its own fix.
- **An app can still compose the root by hand.** `AppConfigProvider`,
  `AppProviders` and `AppShell` remain individually reachable;
  `RootComponent` is the assembled default, not the only path.
- The theme toggle and the logout control are now siblings in the footer that
  each read their own state, so the logout button picks up the density
  preference it previously ignored.
