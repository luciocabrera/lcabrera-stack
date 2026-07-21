# Enterprise Orders Route Architecture

Enterprise table route for large-order operational data with a dedicated constants map for column behavior.

## Purpose

- Expose `/enterprise-orders` as a table-centric operational view.
- Configure table columns, pinning defaults, and route-specific rendering behavior.
- Keep route wiring (`loader`, `meta`, `layout`, `errorBoundary`) local to this folder.
- **The auth guard is currently NOT applied.** `authMiddleware` (`@/auth`) exists and
  is unit-tested, but `export const middleware = [authMiddleware]` is commented out in
  `root.ts` — it broke client-side navigation into the subtree — and the two resource
  routes (`_action/enterprise-orders/delete`, `_api/enterprise-orders/paginated`) do
  not export it either. **Treat this subtree and both endpoints as unauthenticated
  until that is resolved.** The create/edit actions still read the user from
  `context.get(authContext)` for `last_modified_by`.
- **Once re-enabled**, the guard belongs in three places — `root.ts` plus both resource
  routes — so the mutation and data endpoints are covered, not just the UI subtree.
  Unauthenticated requests then redirect to `/login?redirectTo=<url>`.

## Constants Responsibilities

The file [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx) owns:

- `PERSISTENCE_KEY` used by the table persistence layer.
- `DEFAULT_COLUMN_PINNING` route default pinning (`actions` pinned right, used
  by the "reset to default pinning" flow).
- `COLUMNS` definitions, including filter adapters. `COLUMNS` no longer
  declares an `actions` entry: since `CRUD` (passed as `metaState.crud`)
  enables `read`/`update`/`delete`, `@lcabrera/ui/components/Table`'s
  `getInitialColumnsState` synthesizes and right-pins the row-actions column
  automatically (see `resolveTableActionsColumn` /
  `createActionsColumn` in `@lcabrera/ui/components/Table/utils`).

The route loader also uses `COLUMNS` as the source of truth for standalone URL filter validation, so mismatched filter payloads are discarded before the enterprise orders API request is built.

Columns are fully serializable (ADR-009): the loader decorates `COLUMNS`
with `appendDistinctFilterDescriptors({ transport: 'bff', schemaName,
tableName })` and returns them **inside** `columnsState` — no client-side
re-attach step. Static enum columns carry `kind: 'static'` descriptors from
`createStaticFilterOptions`; filterable string columns get baked
`kind: 'distinct'` descriptors that the client tool executes against
`GET /api/distinct` (allow-listed in api-shared's `DISTINCT_SOURCES`).
`enterprise-orders.loader.test.ts` guards the no-functions contract and the
descriptor wiring. The synthesized actions column is static, non-resizable,
and non-filterable by default, which prevents unpinning and width changes
from UI controls.

The actions-cell link content is center-aligned via route-local StyleX styles
so the icon button remains visually centered in the narrow pinned actions
column.

## Duplication Guardrail

- Repeated string columns are composed through `createBasicColumn(...)` from `@lcabrera/ui/components/Table/utils` in [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx); their distinct filter descriptors are appended once in the loader by `appendDistinctFilterDescriptors` (ADR-009) instead of per-column wiring.
- This keeps the descriptor params (`schemaName`/`tableName`/`columnName`) consistent across customer and shipping fields while preserving each column's label/width metadata.
- The row-actions column is likewise never hand-declared here — it's synthesized by `TableConfigProvider` (via `getInitialColumnsState` / `resolveTableActionsColumn`) from `CRUD`, keeping store initialization explicit and side-effect free.

## CRUD via route-driven modals

The list route is the **parent layout** (`root.ts` → `EnterpriseOrders.layout.tsx`),
which renders the table **plus an `<Outlet/>`**. The create/view/edit routes are its
children and render `<Modal><Form/></Modal>` into that outlet, so each opens as a modal
overlaid on the still-visible list (feature plan §4). At `/enterprise-orders` the outlet is
empty. `Modal.onClose` and the Form's Cancel navigate back to the list; a successful action
`redirect`s to the new/updated record's view.

- `new-order/` — `clientAction` (browser Zod validation → `serverAction` only on pass) +
  `action` (re-validate → assign `order_id` via `getMaxValue`+1 → derive totals →
  `insertRow` → redirect to view).
- `edit-order/` — `loader` (`selectRows` by `order_id`, 404 if missing) + `clientAction` +
  `action` (re-validate → recompute totals → `updateRows` → redirect to view).
- `order-detail/` — read-only `view`-mode Form; serves both `view/:orderId` and the bare
  `:orderId` route (the intentional duplicate detail routes, feature plan §8 item 5).
- `OrderFormModal/` — shared Modal+Form wrapper; `utils/orderFormFields.util.ts` builds the
  tab → card-group → row field tree per mode from the shared `@lcabrera/ui` Form builders
  (`createFieldBuilders<EnterpriseOrderValues>()`); `orderClientAction.ts` is the shared
  browser gate.

### `config/` — entity data + pure rules (no SQL, no `pg`)

Client-safe types (`EnterpriseOrder`, `EnterpriseOrderValues`), the `{ schema, table }` +
column/`allowedColumns`/enum sets, the shared create/update **Zod schema**, and pure
derivation/mapping utils (`deriveOrderTotals`, `toOrderInsertValues`/`toOrderUpdateValues`,
`readOrderFormValues`, `toOrderFieldErrors`, `toOrderFormValues`). Each util is pure with a
colocated test.

### `.server/enterpriseOrders.service.ts` — server-only Postgres access

Wraps the generic `@lcabrera/server` executors (`selectRows`/`insertRow`/`updateRows`/
`deleteRows`/`getMaxValue`) with the enterprise-orders `{ schema, table, allowedColumns }`
baked in — **no entity-specific SQL**. It reaches Postgres via `getPool`, which reads `DB_*`
env (sourced from `docker/local/.env` by the app's `dev` script). The
`/_action/enterprise-orders/delete` action calls `deleteOrder` here, fixing the prior
api-server 404 (feature plan §8 bug 1).

**Why `.server/` and not `server/`:** the leading dot makes this a React Router
[server-only module](https://reactrouter.com/api/framework-conventions/server-modules)
directory — every file inside is stripped from the client bundle, and the **build fails**
if any client-reachable module imports it (RR 8's plugin matches `/\.server\//` on the
resolved path, so a nested `.server/` under `routes/` is enforced too). This upgrades the
old "imported only from loaders/actions" comment from a convention into a build-time
guarantee. Its consumers are exactly the server-only route modules: the list `loader`, the
`new`/`edit` `action`s, the `order-detail` `loader`, and the two resource routes
(`_api/enterprise-orders/paginated` loader, `_action/enterprise-orders/delete` action).
Route modules themselves must **never** be `.server` — they need both graphs — so the
server-only code lives here and they import it.
