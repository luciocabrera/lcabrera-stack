# Artifact Inventory (`apps/react-router`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@lcabrera/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). The browser fetch layer lives in `@lcabrera/api` (`packages/api/src/`), and Postgres access in `@lcabrera/server` (`packages/server/src/`); the two split on runtime, so which one a utility belongs to is decided by whether it may run in a browser. This file tracks only artifacts genuinely local to this app.

---

## Routes

| Route                  | Location                     | Description                                                                                                                                                                             |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`               | `routes/login/`              | Auth login built with the `@lcabrera/ui` Form; `clientAction` Zod-validates (no server hit on failure) then delegates to the credential-verifying server `action`; honors `?redirectTo` |
| `/logout`              | `routes/logout/`             | Action-only route; clears the auth cookie and redirects to `/login` (POST only)                                                                                                         |
| `/_api/filter-options` | `routes/api/filter-options/` | Resource route for `transport: 'loader'` filter-option descriptors (ADR-009); its loader calls the BFF `/api/distinct` server-side                                                      |
| `/wide-alltypes-150`   | `routes/wide-alltypes-150/`  | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation                                                                                      |

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

`authMiddleware` exists and is unit-tested, but is **not currently applied anywhere** — the `middleware = [authMiddleware]` export is commented out in `enterprise-orders/root.ts` (it broke client-side navigation into the subtree), and neither resource route exports it. Treat the enterprise-orders subtree, `_action/enterprise-orders/delete` and `_api/enterprise-orders/paginated` as unauthenticated until the middleware issue is resolved.

---

## Root shell (`src/root/`)

| Artifact             | Location                           | Description                                                                                                                                                         |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`               | `root/Root.component.tsx`          | This app's root route: `@lcabrera/ui`'s `RootComponent` with this app's id, route links and logout route (ADR-053) — the shell assembly itself lives in the package |
| `getNavigationItems` | `root/getNavigationItems.util.tsx` | This app's own sidebar route links, sized to the navigation density it is called with                                                                               |

---

## Keeping This Inventory Current

When you add, rename, or remove an artifact:

- Add / update the row in the relevant table above
- If enhancing an existing artifact (making it more generic), update its description row — do **not** add a new row
