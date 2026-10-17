# Artifact Inventory (`apps/showcase`)

Before creating anything new, check this inventory. If something here does the job — or could do it with a small enhancement to make it more generic — **prefer enhancing the existing artifact** over creating a new one.

Shared components/hooks/utils/design-tokens live in `@lcabrera/ui` — see [`packages/ui/src/INVENTORY.md`](../../../packages/ui/src/INVENTORY.md). The browser fetch layer lives in `@lcabrera/api` (`packages/api/src/`), and Postgres access in `@lcabrera/server` (`packages/server/src/`); the two split on runtime, so which one a utility belongs to is decided by whether it may run in a browser. This file tracks only artifacts genuinely local to this app.

---

## Routes

Every table route serves its own rows from Postgres — see
[`docs/data-sources.md`](../docs/data-sources.md) for the shared shape and the
`VITE_API_URL` override.

| Route                               | Location                                  | Description                                                                                                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                            | `routes/login/`                           | Auth login built with the `@lcabrera/ui` Form; `clientAction` Zod-validates (no server hit on failure) then delegates to the credential-verifying server `action`; honors `?redirectTo`                                                                                   |
| `/logout`                           | `routes/logout/`                          | Action-only route; clears the auth cookie and redirects to `/login` (POST only)                                                                                                                                                                                           |
| `/car-sales`                        | `routes/car-sales/`                       | `car_sales` in one bounded slice, paginated in the browser; owns the entity `config/` and the `.server` service both car-sales routes read through                                                                                                                        |
| `/car-sales-infinite`               | `routes/car-sales-infinite/`              | The same table and columns through infinite scroll; reuses `/car-sales`'s `COLUMNS`, `config/` and service                                                                                                                                                                |
| `/wide-alltypes-150`                | `routes/wide-alltypes-150/`               | Stress-test page for the `wide_alltypes_150` dataset using the shared `TableLayout` implementation                                                                                                                                                                        |
| `/skill-scores`                     | `routes/skill-scores/`                    | A database-free grid whose loader sends a `cell` call of each built-in kind and a `cellPalette` defining the `caution` tone; `SkillScores.cellRenderers.test.tsx` also registers a Zod-backed renderer; `sortSkillScoreRows` orders its static rows by the requested sort |
| `/evals`                            | `routes/evals/overview/`                  | Behind `EVALS_DASHBOARD=1`: the latest run of each eval suite with its pass rate, Wilson interval, cost and duration, a sparkline of its last runs whose every point links to that run, and a banner when main's latest rate falls below the previous main run's interval |
| `/evals/runs/:runId`                | `routes/evals/run-detail/`                | Behind the same flag: one run's figures, a trial chart whose every point links to `?trial=<id>`, that trial's figures, and the run's trials through `TableRouteView`                                                                                                      |
| `/evals/runs/:runId/trials`         | `routes/evals/run-trials/`                | Resource route serving the run page's load-more — raw JSON `{ data, total }`, the same projection as the first page                                                                                                                                                       |
| `/_api/filter-options`              | `routes/api/filter-options/`              | Resource route for `transport: 'loader'` filter-option descriptors (ADR-009); its loader reads Postgres server-side                                                                                                                                                       |
| `/_api/car-sales/paginated`         | `routes/api/car-sales-paginated/`         | Resource route serving `/car-sales-infinite`'s load-more from `selectCarSalesPage` — raw JSON `{ data, hasMore, total }`                                                                                                                                                  |
| `/_api/wide-alltypes-150/paginated` | `routes/api/wide-alltypes-150-paginated/` | Resource route serving `/wide-alltypes-150`'s load-more from `selectWideAlltypes150Page` — raw JSON `{ data, hasMore, total }`                                                                                                                                            |

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

### Eval dashboard (`routes/evals/`)

Every loader reads through `.server/evalsHistory.service.ts`, which runs
`@repo/eval-history`'s query functions on its reader pool, never SQL of its
own, so the allow-list those functions project through is the one guarantee of
what a public route returns.

| Artifact                                | Location                                   | Description                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requireEvalsDashboard`                 | `.server/requireEvalsDashboard.service.ts` | The one read of `EVALS_DASHBOARD`; throws a 404 `Response` unless it is `1`. Every `/evals` loader calls it first                                            |
| `selectRunSummaries`, `selectRunTrials` | `.server/evalsHistory.service.ts`          | The loaders' only database access: the run and trial readers bound to the reader pool                                                                        |
| `Sparkline`                             | `Sparkline/`                               | A small SVG point chart drawn with StyleX, exposed as a labelled group; every point is a named router link, optionally joined by a line and toned by outcome |
| `sparklineGeometry`                     | `Sparkline/sparklineGeometry.util.ts`      | Pure: each point's position in the chart box, scaled to the top value, plus the polyline joining them                                                        |
| `toSuiteSummaries`                      | `overview/toSuiteSummaries.util.ts`        | The newest run of each suite and its scored runs as chart points, oldest first, each linked to its run                                                       |
| `suiteRegressions`                      | `overview/suiteRegressions.util.ts`        | The suites whose latest main run has a rate below the lower bound of the main run before it                                                                  |
| `parseTrialPageParams`                  | `run-trials/parseTrialPageParams.util.ts`  | The trial resource route's `limit`/`skip`/`sort` params, clamped to `EVALS_TRIALS_PAGE_LIMIT`; a `sort` that fails `trialSortParamSchema` reads as no sort   |
| `runFigures`                            | `utils/runFigures.util.ts`                 | A run summary plus its pass rate, Wilson interval at `EVALS_INTERVAL` and wall-clock duration, with dates as ISO strings                                     |
| `trialChartPoints`                      | `utils/trialChartPoints.util.ts`           | One chart point per trial: its duration, toned by outcome, linked to `?trial=<id>` on its run                                                                |
| `toTrialPage`                           | `utils/toTrialPage.util.ts`                | A page of trials as table rows, the invoked skills joined into one cell                                                                                      |
| `toTrialSorting`                        | `utils/toTrialSorting.util.ts`             | The table's sorting renamed to the `{ column, direction }` the trial query takes                                                                             |
| `isRunId`                               | `utils/isRunId.util.ts`                    | Whether a route param is a run id, so a malformed one answers 404 before any query                                                                           |
| `parseTrialId`                          | `utils/parseTrialId.util.ts`               | The `?trial=` param as a trial id, or nothing when it is not a positive bigint                                                                               |
| `isTrialPage`                           | `utils/isTrialPage.util.ts`                | Shape guard for the trial resource route's JSON                                                                                                              |
| `evalsHref`                             | `utils/evalsHref.util.ts`                  | The link to a run, or to one trial of it                                                                                                                     |
| `evalsRouteEntries`                     | `utils/evalsRouteEntries.util.ts`          | The route config's `/evals` entries with their full paths — what the flag and public-payload tests iterate, so a new route is covered                        |
| `routeLoaderArgs`                       | `utils/routeLoaderArgs.util.ts`            | Loader args for a route path with its params filled in; refuses a param it has no value for                                                                  |
| `passRateLabel`                         | `utils/passRateLabel.util.ts`              | A pass rate as a percentage with its k/n                                                                                                                     |
| `intervalLabel`                         | `utils/intervalLabel.util.ts`              | An interval as two percentages, or why there is none                                                                                                         |
| `costLabel`                             | `utils/costLabel.util.ts`                  | A cost in dollars, or `not reported`                                                                                                                         |
| `durationLabel`                         | `utils/durationLabel.util.ts`              | A duration in hours, minutes or seconds                                                                                                                      |
| `trialSummaryLabel`                     | `utils/trialSummaryLabel.util.ts`          | One trial's figures as a sentence, naming each missing one                                                                                                   |
| `runFacts`                              | `utils/runFacts.util.ts`                   | The run page's term-and-value list, saying which figures the run did not record                                                                              |

### Server-side route helpers (`routes/enterprise-orders/.server/`)

Read by the domain's own loaders **and** by the resource routes that serve it,
so they live with the domain rather than inside one of its callers.

| Artifact     | Location                              | Description                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ordersPage` | `.server/enterpriseOrders.service.ts` | This table declared once to `@lcabrera/server`'s `createTablePageReader` — target, list projection, ceilings, fallback sort and primary key. `selectOrdersPage`, `resolveOrdersPageRead`, `resolveOrdersGroupRead`, `resolveOrdersGroupRestriction` and `deleteOrder` are its bound functions, so every entry point reaches the same clamps |

### Order form fields (`routes/enterprise-orders/utils/`)

Create and edit each have their own builder. Shared tab helpers are one util per file. Neither builder takes a mode flag.

| Artifact                     | Location                             | Description                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `buildCreateOrderFormFields` | `buildCreateOrderFormFields.util.ts` | Field tree for a new order. Omits `order_number`, computed totals, and the audit group.          |
| `buildEditOrderFormFields`   | `buildEditOrderFormFields.util.ts`   | Field tree for an existing order. Includes `order_number`, computed totals, and the audit group. |
| `toOrderFormFields`          | `toOrderFormFields.util.ts`          | Assembles the shared tab roster around the create/edit Order, Pricing, and Notes tabs.           |
| `buildCreateOrderTab`        | `buildCreateOrderTab.util.ts`        | Order tab without `order_number`.                                                                |
| `buildEditOrderTab`          | `buildEditOrderTab.util.ts`          | Order tab with a disabled `order_number`.                                                        |
| `buildCustomerTab`           | `buildCustomerTab.util.ts`           | Customer identity and loyalty fields.                                                            |
| `buildProductTab`            | `buildProductTab.util.ts`            | Product category, quantity, and measures.                                                        |
| `buildCreatePricingTab`      | `buildCreatePricingTab.util.ts`      | Pricing inputs only.                                                                             |
| `buildEditPricingTab`        | `buildEditPricingTab.util.ts`        | Pricing inputs plus read-only computed totals.                                                   |
| `buildShippingTab`           | `buildShippingTab.util.ts`           | Shipping address and logistics.                                                                  |
| `buildBillingTab`            | `buildBillingTab.util.ts`            | Billing address.                                                                                 |
| `buildPaymentTab`            | `buildPaymentTab.util.ts`            | Payment status, method, and reference.                                                           |
| `buildCreateNotesTab`        | `buildCreateNotesTab.util.ts`        | Notes without the audit group.                                                                   |
| `buildEditNotesTab`          | `buildEditNotesTab.util.ts`          | Notes plus the collapsed audit group.                                                            |
| `buildOrderSummaryFields`    | `buildOrderSummaryFields.util.ts`    | Shared summary fields: date, status, priority.                                                   |
| `buildFlagsGroup`            | `buildFlagsGroup.util.ts`            | Rush, gift, fragile, and signature toggles.                                                      |
| `buildPricingInputsGroup`    | `buildPricingInputsGroup.util.ts`    | Discount, shipping cost, and paid amount.                                                        |
| `buildNotesGroup`            | `buildNotesGroup.util.ts`            | Order and internal notes.                                                                        |
| `collectOrderFormAccessors`  | `collectOrderFormAccessors.util.ts`  | Leaf accessors from an order-form field tree.                                                    |
| `readOrderFormTabLabels`     | `readOrderFormTabLabels.util.ts`     | Tab labels from an order-form field tree, in roster order.                                       |

---

## Database setup (`db/`, `scripts/`)

Outside `src/`, but the routes above have nothing to read without it. This app
seeds every table it queries, taking `enterprise_orders` from the DDL devkit
ships rather than a copy of its own — see
[`db/README.md`](../db/README.md) and
[ADR-071](../../../docs/decisions/ADR-071-split-the-demo-database-setup.md).

| Artifact               | Location   | Description                                                                                                                      |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `setup_large_data.sql` | `db/`      | `car_sales` + `wide_alltypes_150`. A copy lives in a separate repository; the two are independent (see `db/README.md`)           |
| `seed-db-sources.mjs`  | `scripts/` | What the seeder applies, in order — `enterprise_orders` from the DDL `@lcabrera/devkit` ships, raised to the load-test row count |
| `seed-db.mjs`          | `scripts/` | Creates `DB_NAME` if absent, then applies every source through `pg`. `vp run --filter showcase seed`                             |

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
