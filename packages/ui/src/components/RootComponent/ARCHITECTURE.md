# RootComponent Architecture

## Purpose

The whole root route of a consuming app, in one component. It reads the root
loader's data, composes the app-wide providers and renders the shell, so an app
supplies only what genuinely depends on the app rather than reproducing the
assembly. Same reasoning as `hydrateApp` and `createHandleRequest` one layer
down — see [ADR-053](../../../../../docs/decisions/ADR-053-package-owned-app-root-and-app-config-context.md).

## Public API

`RootComponentProps` (`RootComponent.types.ts`):

| Prop                 | Type                 | Default   | Description                                                                         |
| -------------------- | -------------------- | --------- | ----------------------------------------------------------------------------------- |
| `appId`              | `string`             | —         | Scopes the theme / global-settings cookies, which are shared across ports on a host |
| `defaultTheme`       | `ThemeMode`          | `'light'` | Theme used when the request carries no theme cookie                                 |
| `getNavigationItems` | `GetNavigationItems` | —         | This app's own route links, sized to the navigation's density                       |
| `isAuthEnabled`      | `boolean`            | `false`   | Whether the app has a session, i.e. whether the navigation shows session controls   |
| `logoutRoute`        | `string`             | `/logout` | Where those session controls POST                                                   |

`RootComponentLoaderData` is the minimal subset of the root loader's data this
component reads (`globalSettings`, `theme`). It is declared here rather than
imported from an app's generated loader type, because that type is app-specific
and this component is not — the same call `AppDocument` makes for `rootData`.
`getRootLoaderData` (`@lcabrera/ui/routing/shared`) returns a superset of it, so
an app whose root loader delegates to that helper satisfies it by construction.

## Composition

```mermaid
graph TD
  Root[RootComponent] --> Loader[useLoaderData → globalSettings, theme]
  Root --> Config[AppConfigProvider]
  Config --> Providers[AppProviders]
  Providers --> Shell[AppShell]
  Shell --> Nav[AppNavigation]
  Shell --> Outlet["main → Outlet"]
```

`AppConfigProvider` sits outermost because it carries values fixed at mount;
`AppProviders` owns the state that changes (theme, global settings,
notifications). Neither ordering affects behaviour — this one reads in the
direction of "configuration, then state".

Nothing is threaded past `AppShell`: `getNavigationItems`, `isAuthEnabled` and
`logoutRoute` reach the delegate that renders them through `AppConfigContext`.

## File Structure

- `RootComponent.component.tsx` — the loader read and the provider composition
- `RootComponent.types.ts` — props and the loader-data subset
- `RootComponent.component.test.tsx` — tests

There is no `index.ts`: the component is published from `public-api.ts` (i.e.
`@lcabrera/ui`), and a barrel nobody imports through is the deep-barrel ADR-007
rule 3 bans — fallow flags it as an unused file.

## Consuming It

```tsx
import { RootComponent } from '@lcabrera/ui';

import { LOGOUT_ROUTE } from '@/auth/auth.constants';
import { APP_ID } from '@/constants/app.constants';

import { getNavigationItems } from './getNavigationItems.util';

export const Root = () => (
  <RootComponent
    appId={APP_ID}
    defaultTheme='light'
    getNavigationItems={getNavigationItems}
    isAuthEnabled
    logoutRoute={LOGOUT_ROUTE}
  />
);
```

An app that needs a different assembly still has the pieces: `AppConfigProvider`
(`@lcabrera/ui/contexts/AppConfigContext`), `AppProviders` and `AppShell` are all
individually exported. `RootComponent` is the assembled default, not the only
path.

The document shell stays app-owned — `Root.layout.tsx` reads `cspNonce` through
`useRouteLoaderData('root')` outside the router's component tree, and each app's
compiled StyleX stylesheet URL is a per-app build artifact.
