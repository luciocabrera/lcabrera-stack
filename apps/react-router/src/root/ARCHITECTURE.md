# Root Architecture

Root route composition for app-wide document layout, SSR hydration scripts, and initial theme/csp loader state.

## Files

| File                          | Responsibility                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `Root.layout.tsx`             | Defines `<html>` shell and appends `Links`, `Meta`, `ScrollRestoration`, and `Scripts`              |
| `root.links.ts`               | Registers favicon and global reset stylesheet links                                                 |
| `root.loader.ts`              | Reads request cookies and CSP nonce for SSR (delegates to `getRootLoaderData`)                      |
| `Root.component.tsx`          | Configures `@lcabrera/ui`'s `RootComponent` with this app's id, route links, theme and logout route |
| `getNavigationItems.util.tsx` | This app's own sidebar route links                                                                  |

## App Shell

The shell itself is package-owned ([ADR-053](../../../../docs/decisions/ADR-053-package-owned-app-root-and-app-config-context.md)):
`RootComponent` reads the root loader's data, mounts the app-wide providers and
renders `AppShell`, so this app declares only what depends on this app. That is
also why there is no `LogoutControl` here any more — the navigation footer
renders its own session controls when an app passes `isAuthEnabled`, and this
app passes `LOGOUT_ROUTE` as the route they POST to.

`AppNavigation` owns the left sidebar — permanently docked — plus its
compact/full mode. The route outlet remains the only scrollable main content
region.

`Root.layout.tsx` stays app-owned: it reads `cspNonce` via
`useRouteLoaderData('root')` from outside the router's component tree, and it
passes this app's compiled StyleX stylesheet URL, which is a per-app build
artifact the package cannot source.

## CSP Nonce Flow

A reverse proxy/CDN can inject `x-csp-nonce` request headers.

1. `@lcabrera/ui/utils/security/cspNonce.util.ts` provides the shared nonce parser (`getRequestCspNonce`).
2. `root.loader.ts` reads nonce and returns `cspNonce`.
3. `Root.layout.tsx` reads root loader data and forwards nonce to `ScrollRestoration` and `Scripts`.
4. `entry.server.tsx` reads the same nonce and passes `nonce` to `renderToPipeableStream` so React streaming inline scripts carry the nonce.

This keeps strict CSP compatibility without enabling `unsafe-eval`.
