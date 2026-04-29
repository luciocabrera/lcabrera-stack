# Root Architecture

Root route composition for app-wide document layout, SSR hydration scripts, and initial theme/csp loader state.

## Files

| File                 | Responsibility                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `Root.layout.tsx`    | Defines `<html>` shell and appends `Links`, `Meta`, `ScrollRestoration`, and `Scripts`            |
| `root.loader.ts`     | Reads request cookies and CSP nonce for SSR                                                       |
| `Root.component.tsx` | Mounts `ThemeProvider`, `NotificationProvider`, route outlet, and dev DB preflight warning banner |
| `Root.types.ts`      | Root-local types such as `DbSanityPayload` for dev preflight checks                               |
| `Root.stylex.ts`     | Root layout and dev warning banner styles                                                         |

## CSP Nonce Flow

A reverse proxy/CDN can inject `x-csp-nonce` request headers.

1. `utils/security/cspNonce.util.ts` provides the shared nonce parser (`getRequestCspNonce`).
2. `root.loader.ts` reads nonce and returns `cspNonce`.
3. `Root.layout.tsx` reads root loader data and forwards nonce to `ScrollRestoration` and `Scripts`.
4. `entry.server.tsx` reads the same nonce and passes `nonce` to `renderToPipeableStream` so React streaming inline scripts carry the nonce.

This keeps strict CSP compatibility without enabling `unsafe-eval`.

## Dev DB Sanity Preflight

On client startup in development mode, `Root.component.tsx` calls `/api/db-sanity` once.

- If DB sanity is healthy, nothing is shown.
- If the endpoint fails or reports unhealthy state, a warning banner is rendered at the top of the app.

This provides immediate feedback when local DB tables are empty/missing after Docker/container resets.
