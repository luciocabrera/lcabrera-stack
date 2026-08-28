# Artifact Inventory (`apps/showcase`)

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

| Artifact                   | Location                                | Description                                                                                                                                                   |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetchCarSalesPage`        | `services/carSales.api.ts`              | A page of `car_sales`, plus the `CarSale` / `CarSalesResponse` shapes; applies `fakeDelay` for the loading-skeleton demo                                      |
| `fetchWideAlltypes150Page` | `services/wideAlltypes150.api.ts`       | A page of `wide_alltypes_150`, plus the `WideAlltypes150` / `WideAlltypes150Response` shapes                                                                  |
| `isExternalApiEnabled`     | `services/isExternalApiEnabled.util.ts` | **Whether** the external path is taken — the app's only read of `VITE_API_URL`, treating an empty value as unset. **Where** it goes is `getApiBaseUrl` (#705) |
| `fakeDelay`                | `services/fakeDelay.util.ts`            | Artificial `VITE_API_DELAY_MS` delay so the loading skeleton is visible against a local data source; no-ops when unset                                        |

### Server-side route helpers (`routes/enterprise-orders/.server/`)

Read by the domain's own loaders **and** by the resource routes that serve it,
so they live with the domain rather than inside one of its callers.

| Artifact                        | Location                                        | Description                                                                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseOrdersPageParams`         | `.server/parseOrdersPageParams.util.ts`         | Turns this table's filter/sort/paging search params into query-descriptor pieces. Deliberately does **not** clamp — both bounds live in `selectOrdersPage`, which every entry point reaches                                                        |
| `resolveOrdersGroupRead`        | `.server/resolveOrdersGroupRead.util.ts`        | This route's binding of `@lcabrera/server`'s `resolveGroupRead` — its page ceiling, its tiebreaker column and its truncation lookup, and nothing else. The decision itself lives in the package, because every consumer would otherwise rewrite it |
| `resolveOrdersGroupRestriction` | `.server/resolveOrdersGroupRestriction.util.ts` | This route's binding of `@lcabrera/server`'s `resolveGroupRestriction` — its truncation lookup, and nothing else. What the panel and the dialog title state about the group both come from it (ADR-094)                                            |
| `resolveOrdersPageRead`         | `.server/resolveOrdersPageRead.util.ts`         | `/paginated`'s fetch-vocabulary params parsed once, then handed to `resolveOrdersGroupRead`. The modal route skips this half — the table factory has already parsed the page vocabulary — so the group rule is stated once for both                |

---

## Database setup (`db/`, `scripts/`)

Outside `src/`, but the routes above have nothing to read without it. This app
owns the DDL for every table it queries and seeds itself — see
[`db/README.md`](../db/README.md) and
[ADR-071](../../../docs/decisions/ADR-071-split-the-demo-database-setup.md).

| Artifact                      | Location   | Description                                                                                                            |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `setup_large_data.sql`        | `db/`      | `car_sales` + `wide_alltypes_150`. A copy lives in a separate repository; the two are independent (see `db/README.md`) |
| `setup_enterprise_orders.sql` | `db/`      | `enterprise_orders` — this app is the only thing that serves it                                                        |
| `seed-db.mjs`                 | `scripts/` | Creates `DB_NAME` if absent, then applies both files through `pg`. `vp run --filter showcase seed`                     |

---

## Auth (`src/auth/`)

Self-contained, server-only auth for the secured-routes showcase.

| Artifact                                  | Location                         | Description                                                                                                                                                                                             |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authMiddleware`                          | `auth/authMiddleware.ts`         | **Reusable** React Router `middleware`: verify auth cookie → redirect to `/login?redirectTo=…` on failure, else publish claims on `authContext`. Apply via `middleware = [authMiddleware]` on any route |
| `authContext`                             | `auth/authContext.ts`            | `createContext<AuthClaims>()` — the verified identity for the current request                                                                                                                           |
| `signAuthToken` / `verifyAuthToken`       | `auth/*.util.ts`                 | Mint / verify the stateless HMAC-signed claims token (`<payloadB64>.<sig>`); reuse `generate/parseApiToken` primitives                                                                                  |
| `resolveAuthClaims`                       | `auth/resolveAuthClaims.util.ts` | Read the cookie + verify — the shared gate used by the middleware and the login loader                                                                                                                  |
| `getDemoCredential` / `verifyCredentials` | `auth/*.util.ts`                 | Env-configured demo account (`hashSecret` hash) + `isSecretHashValid` password check                                                                                                                    |

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

- Add / update the row in the relevant table above. The description is **one sentence**.
- If enhancing an existing artifact (making it more generic), update that row — do **not** add a new row
