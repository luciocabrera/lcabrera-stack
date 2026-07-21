# Auth (`src/auth/`)

Self-contained, **server-only** authentication for the secured-routes showcase
(epic #79, Track 4). It has no CQMS / `scan-ingestion` coupling — it reuses only
the generic primitives in `@lcabrera/server` (`tokens/*`, `crypto/*`) and RR7's
own cookie/middleware/context APIs.

## What it provides

- A **reusable `authMiddleware`** any route can apply to guard itself.
- A typed **`authContext`** carrying the verified claims to loaders/actions.
- A **stateless, HMAC-signed token** minted at login and verified on every
  request (signature + expiry), transported in an httpOnly cookie.
- An env-configured **demo credential** so the flow runs with zero setup.

## Flow

```mermaid
flowchart TD
  A[Request to a guarded route] --> B[authMiddleware]
  B --> C[readAuthCookie -> token]
  C --> D{resolveAuthClaims:\nverifyAuthToken\n(signature + expiry)}
  D -- invalid/missing --> E[throw redirect\n/login?redirectTo=<url>]
  D -- valid --> F[context.set authContext, claims]
  F --> G[loader/action runs\ncontext.get authContext]

  L[POST /login] --> M[clientAction: Zod validate]
  M -- invalid --> N[return errors\nno network]
  M -- valid --> O[serverAction -> action]
  O --> P[verifyCredentials\nisSecretHashValid]
  P -- ok --> Q[generateApiToken jti\n+ signAuthToken\n+ Set-Cookie]
  Q --> R[redirect redirectTo ?? '/']

  X[POST /logout] --> Y[clear cookie\n+ redirect /login]
```

## The token

`signAuthToken` serializes the claims to `<payloadB64>.<signature>`:

- `payloadB64` — base64url of the `AuthClaims` JSON (`sub`, `jti`, `iat`, `exp`,
  unix **seconds**). `jti` comes from `generateApiToken()` (a random nonce), so
  every session token is unique and unguessable.
- `signature` — HMAC-SHA256 of `payloadB64` under `AUTH_TOKEN_SECRET`.

`verifyAuthToken` splits it with `parseApiToken` (the `.` separator matches the
primitive's `<tokenId>.<secret>` shape), recomputes the HMAC and compares it in
**constant time** (`timingSafeStringEqual`), decodes the claims, and rejects
anything expired. It is stateless — no token store — and pure (`nowSeconds` is
injected), so it is fully unit-testable.

The cookie itself is **unsigned** (`createCookie` without `secrets`): tamper-proofing
is the token's own HMAC, giving a single signature story. `httpOnly` + `sameSite=lax`;
`secure` in production; `Max-Age` mirrors the token TTL.

## Applying the guard (for the orchestrator / any route)

Export a `middleware` array from the route module you want to protect:

```ts
// e.g. routes/enterprise-orders/enterprise-orders.layout.ts
import { authMiddleware } from '@/auth/authMiddleware';

export const middleware = [authMiddleware];
```

Its subtree's loaders/actions then read the identity with
`context.get(authContext)`. **This track deliberately does not wire the guard
onto enterprise-orders** — the orchestrator integrates that once both tracks land.

## Demo credential (configuration)

Configured via env (validated in `env.schema.ts`), all with dev-only defaults:

| Var                       | Default                            | Purpose                                    |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| `AUTH_TOKEN_SECRET`       | `react-router-dev-insecure-…`      | HMAC key that signs the token              |
| `AUTH_DEMO_EMAIL`         | `demo@example.com`                 | The demo account's email                   |
| `AUTH_DEMO_PASSWORD_HASH` | scrypt hash of `demo-password-123` | Stored password hash (`hashSecret` output) |

**Demo login for the showcase:** `demo@example.com` / `demo-password-123`.

No real secret is committed — the default hash is a `hashSecret()` of the
deliberately public demo password above. Override every var in the environment
for anything beyond local demoing; generate a replacement hash with
`hashSecret({ secret })` from `@lcabrera/server/crypto/hash-secret.util`.

## File map

| File                              | Role                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| `auth.types.ts`                   | `AuthClaims`, `DemoCredential`                                          |
| `auth.constants.ts`               | Cookie name, TTL, login route, default redirect (client-safe)           |
| `authContext.ts`                  | `createContext<AuthClaims>()`                                           |
| `env.schema.ts`                   | `readAuthEnvConfig` (Zod) — secret + demo credential                    |
| `authCookie.ts`                   | The httpOnly transport cookie (`createCookie`)                          |
| `signAuthPayload.server.ts`       | HMAC of a payload (server-only — `.server.ts` per the node-import rule) |
| `timingSafeStringEqual.server.ts` | Constant-time compare (server-only)                                     |
| `signAuthToken.util.ts`           | Claims → signed token                                                   |
| `decodeAuthClaims.util.ts`        | Payload → claims (guarded, total)                                       |
| `verifyAuthToken.util.ts`         | Token → claims \| undefined (signature + expiry)                        |
| `readAuthCookie.util.ts`          | Request → raw token (the effectful edge)                                |
| `resolveAuthClaims.util.ts`       | Cookie read + verify — the shared auth gate                             |
| `buildLoginRedirectUrl.util.ts`   | Request → `/login?redirectTo=<enc(url)>`                                |
| `getDemoCredential.util.ts`       | Env → `{ email, secretHash }`                                           |
| `verifyCredentials.util.ts`       | Email match + `isSecretHashValid`                                       |
| `authMiddleware.ts`               | The reusable RR7 guard                                                  |

Every `*.util.ts` / `*.server.ts` has a colocated `*.test.ts`. Server-only files
that import `node:crypto` carry the `.server.ts` suffix (the app's client/server
import-boundary rule exempts it); the rest are pure and named `*.util.ts`.
