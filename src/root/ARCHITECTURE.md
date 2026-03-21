# Root Architecture

Root route composition for app-wide document layout, SSR hydration scripts, and initial theme/csp loader state.

## Files

| File                 | Responsibility                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- |
| `Root.layout.tsx`    | Defines `<html>` shell and appends `Links`, `Meta`, `ScrollRestoration`, and `Scripts` |
| `root.loader.ts`     | Reads request cookies and request CSP nonce headers for SSR                            |
| `Root.component.tsx` | Mounts `ThemeProvider` and route outlet                                                |

## CSP Nonce Flow

A reverse proxy/CDN can inject `x-csp-nonce` or `csp-nonce` request headers.

1. `root.loader.ts` reads nonce headers and returns `cspNonce`.
2. `Root.layout.tsx` reads root loader data and forwards nonce to `ScrollRestoration` and `Scripts`.
3. `entry.server.tsx` reads the same nonce headers and passes `nonce` to `renderToPipeableStream` so React streaming inline scripts carry the nonce.

This keeps strict CSP compatibility without enabling `unsafe-eval`.
