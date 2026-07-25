# Root Architecture

Root route composition for app-wide document layout, SSR hydration scripts, and initial theme/csp loader state.

## Files

| File                 | Responsibility                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- |
| `Root.layout.tsx`    | Defines `<html>` shell and appends `Links`, `Meta`, `ScrollRestoration`, and `Scripts` |
| `root.links.ts`      | Registers favicon and global reset stylesheet links                                    |
| `root.loader.ts`     | Reads request cookies and CSP nonce for SSR                                            |
| `Root.component.tsx` | Mounts app providers, `AppNavigation`, route outlet, and notifications                 |

## App Shell

`Root.component.tsx` renders a flex app shell. `AppNavigation` owns the left sidebar — permanently docked — plus its
compact/full mode, route link registry, and theme toggle placement. The route outlet remains
the only scrollable main content region.

## CSP Nonce Flow

A reverse proxy/CDN can inject `x-csp-nonce` request headers.

1. `@lcabrera/ui/utils/security/cspNonce.util.ts` provides the shared nonce parser (`getRequestCspNonce`).
2. `root.loader.ts` reads nonce and returns `cspNonce`.
3. `Root.layout.tsx` reads root loader data and forwards nonce to `ScrollRestoration` and `Scripts`.
4. `entry.server.tsx` reads the same nonce and passes `nonce` to `renderToPipeableStream` so React streaming inline scripts carry the nonce.

This keeps strict CSP compatibility without enabling `unsafe-eval`.
