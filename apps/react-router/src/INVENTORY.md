# Artifact Inventory (`apps/react-router`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@lcabrera/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). The browser fetch layer lives in `@lcabrera/api` (`packages/api/src/`), and Postgres access in `@lcabrera/server` (`packages/server/src/`); the two split on runtime, so which one a utility belongs to is decided by whether it may run in a browser. This file tracks only artifacts genuinely local to this app.

---

## Routes

Every table route serves its own rows from Postgres — see
[`docs/data-sources.md`](../docs/data-sources.md) for the shared shape and the
`VITE_API_URL` override.

| Route                               | Location                                  | Description                                                                                                                                                                             |
| ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                            | `routes/login/`                           | Auth login built with the `@lcabrera/ui` Form; `clientAction` Zod-validates (no server hit on failure) then delegates to the credential-verifying server `action`; honors `?redirectTo` |
| `/logout`                           | `routes/logout/`                          | Action-only route; clears the auth cookie and redirects to `/login` (POST only)                                                                                                         |
| `/car-sales`                        | `routes/car-sales/`                       | `car_sales` in one bounded slice, paginated in the browser; owns the entity `config/` and the `.server` service both car-sales routes read through                                      |
| `/car-sales-infinite`               | `routes/car-sales-infinite/`              | The same table and columns through infinite scroll; reuses `/car-sales`'s `COLUMNS`, `config/` and service                                                                              |
| `/wide-alltypes-150`                | `routes/wide-alltypes-150/`               | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation                                                                                      |
| `/_api/filter-options`              | `routes/api/filter-options/`              | Resource route for `transport: 'loader'` filter-option descriptors (ADR-009); its loader reads Postgres server-side                                                                     |
| `/_api/car-sales/paginated`         | `routes/api/car-sales-paginated/`         | Resource route serving `/car-sales-infinite`'s load-more from `selectCarSalesPage` — raw JSON `{ data, hasMore, total }`                                                                |
| `/_api/wide-alltypes-150/paginated` | `routes/api/wide-alltypes-150-paginated/` | Resource route serving `/wide-alltypes-150`'s load-more from `selectWideAlltypes150Page` — raw JSON `{ data, hasMore, total }`                                                          |

---

## Data sources (`src/services/`)

The app-local browser fetch layer. Each fetcher targets this app's own resource
route by default and the external API only under the `VITE_API_URL` override.

| Artifact                    | Location                                     | Description                                                                                                                    |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `fetchCarSalesPage`         | `services/carSales.api.ts`                   | A page of `car_sales`, plus the `CarSale` / `CarSalesResponse` shapes; applies `fakeDelay` for the loading-skeleton demo       |
| `fetchWideAlltypes150Page`  | `services/wideAlltypes150.api.ts`            | A page of `wide_alltypes_150`, plus the `WideAlltypes150` / `WideAlltypes150Response` shapes                                   |
| `readExternalApiUrl`        | `services/readExternalApiUrl.util.ts`        | The single read of `VITE_API_URL`; an empty value counts as unset. The two utils below derive from it, so they cannot disagree |
| `isExternalApiEnabled`      | `services/isExternalApiEnabled.util.ts`      | **Whether** the external path is taken — the switch every data path reads                                                      |
| `resolveExternalApiBaseUrl` | `services/resolveExternalApiBaseUrl.util.ts` | **Where** it goes: the override host, ranked ahead of `@lcabrera/api`'s `getApiBaseUrl`, which puts the SSR request URL first  |
| `fakeDelay`                 | `services/fakeDelay.util.ts`                 | Artificial `VITE_API_DELAY_MS` delay so the loading skeleton is visible against a local data source; no-ops when unset         |

---

## Database setup (`db/`, `scripts/`)

Outside `src/`, but the routes above have nothing to read without it. This app
owns the DDL for every table it queries and seeds itself — see
[`db/README.md`](../db/README.md) and
[ADR-071](../../../docs/decisions/ADR-071-split-the-demo-database-setup.md).

| Artifact                      | Location   | Description                                                                                                   |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `setup_large_data.sql`        | `db/`      | `car_sales` + `wide_alltypes_150`. **Duplicated** with `apps/api-server/db/`; keep the two byte-identical     |
| `setup_enterprise_orders.sql` | `db/`      | `enterprise_orders` — this app is the only thing that serves it                                               |
| `seed-db.mjs`                 | `scripts/` | Creates `DB_NAME` if absent, then applies both files through `pg`. `vp run --filter vite-react-compiler seed` |

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
