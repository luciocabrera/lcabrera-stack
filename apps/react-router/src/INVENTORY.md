# Artifact Inventory (`apps/react-router`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@repo/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). API-layer (browser fetch) and Postgres-access utilities live in `@repo/data-access` (`packages/data-access/src/`). This file tracks only artifacts genuinely local to this app.

---

## Routes

| Route                  | Location                     | Description                                                                                                                                                                         |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`               | `routes/login/`              | Auth login built with the `@repo/ui` Form; `clientAction` Zod-validates (no server hit on failure) then delegates to the credential-verifying server `action`; honors `?redirectTo` |
| `/logout`              | `routes/logout/`             | Action-only route; clears the auth cookie and redirects to `/login` (POST only)                                                                                                     |
| `/_api/filter-options` | `routes/api/filter-options/` | Resource route for `transport: 'loader'` filter-option descriptors (ADR-009); its loader calls the BFF `/api/distinct` server-side                                                  |
| `/wide-alltypes-150`   | `routes/wide-alltypes-150/`  | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation                                                                                  |

---

## Auth (`src/auth/`)

Self-contained, server-only auth for the secured-routes showcase. See [`src/auth/ARCHITECTURE.md`](auth/ARCHITECTURE.md) for the full flow and file map.

| Artifact                                  | Location                         | Description                                                                                                                                                                                    |
| ----------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authMiddleware`                          | `auth/authMiddleware.ts`         | **Reusable** RR7 `middleware`: verify auth cookie → redirect to `/login?redirectTo=…` on failure, else publish claims on `authContext`. Apply via `middleware = [authMiddleware]` on any route |
| `authContext`                             | `auth/authContext.ts`            | `createContext<AuthClaims>()` — the verified identity for the current request                                                                                                                  |
| `signAuthToken` / `verifyAuthToken`       | `auth/*.util.ts`                 | Mint / verify the stateless HMAC-signed claims token (`<payloadB64>.<sig>`); reuse `generate/parseApiToken` primitives                                                                         |
| `resolveAuthClaims`                       | `auth/resolveAuthClaims.util.ts` | Read the cookie + verify — the shared gate used by the middleware and the login loader                                                                                                         |
| `getDemoCredential` / `verifyCredentials` | `auth/*.util.ts`                 | Env-configured demo account (`hashSecret` hash) + `isSecretHashValid` password check                                                                                                           |

The guard is applied to the enterprise-orders **UI subtree** (`enterprise-orders/layout.ts`) and to its two resource routes — `_action/enterprise-orders/delete` and `_api/enterprise-orders/paginated` both export `middleware = [authMiddleware]`, so the mutation and data endpoints can't be driven without a session.

---

## Root shell (`src/root/`)

| Artifact        | Location                           | Description                                                                                                                                                                  |
| --------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LogoutControl` | `root/LogoutControl.component.tsx` | Session control for the `@repo/ui` `AppShell` `sessionActions` slot: a POST `<Form>` to `/logout`; icon-only + tooltip when the nav is collapsed, mirroring the theme toggle |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
