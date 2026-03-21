# Security Utilities Architecture

Security-related shared utilities.

## Files

| File               | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `cspNonce.util.ts` | Provides standardized CSP nonce header contract and request parser |

## CSP Nonce Contract

- Header name: `x-csp-nonce`
- Reader: `getRequestCspNonce(request)`

This utility is shared by SSR entry and root loader to ensure nonce handling is consistent across server rendering and script hydration.
