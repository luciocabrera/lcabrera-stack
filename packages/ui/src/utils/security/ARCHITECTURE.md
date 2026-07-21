# Security Utilities Architecture

Security-related shared utilities.

## Files

| File                    | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `security.constants.ts` | Standardized CSP nonce header name constant (`x-csp-nonce`) |
| `cspNonce.util.ts`      | Request parser for standardized CSP nonce header            |

## CSP Nonce Contract

- Header name: `x-csp-nonce`
- Reader: `getRequestCspNonce(request)`

This utility is shared by SSR entry and root loader to ensure nonce handling is consistent across server rendering and script hydration.
