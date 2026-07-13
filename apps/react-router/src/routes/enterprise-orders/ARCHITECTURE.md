# Enterprise Orders Route Architecture

Enterprise table route for large-order operational data with a dedicated constants map for column behavior.

## Purpose

- Expose `/enterprise-orders` as a table-centric operational view.
- Configure table columns, pinning defaults, and route-specific rendering behavior.
- Keep route wiring (`loader`, `meta`, `layout`, `errorBoundary`) local to this folder.

## Constants Responsibilities

The file [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx) owns:

- `PERSISTENCE_KEY` used by the table persistence layer.
- `DEFAULT_COLUMN_PINNING` route default pinning (`actions` pinned right, used
  by the "reset to default pinning" flow).
- `COLUMNS` definitions, including filter adapters. `COLUMNS` no longer
  declares an `actions` entry: since `CRUD` (passed as `metaState.crud`)
  enables `read`/`update`/`delete`, `@repo/ui/components/Table`'s
  `getInitialColumnsState` synthesizes and right-pins the row-actions column
  automatically (see `resolveTableActionsColumn` /
  `createActionsColumn` in `@repo/ui/components/Table/utils`).

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

- Repeated string columns are composed through `createBasicColumn(...)` from `@repo/ui/components/Table/utils` in [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx); their distinct filter descriptors are appended once in the loader by `appendDistinctFilterDescriptors` (ADR-009) instead of per-column wiring.
- This keeps the descriptor params (`schemaName`/`tableName`/`columnName`) consistent across customer and shipping fields while preserving each column's label/width metadata.
- The row-actions column is likewise never hand-declared here — it's synthesized by `TableConfigProvider` (via `getInitialColumnsState` / `resolveTableActionsColumn`) from `CRUD`, keeping store initialization explicit and side-effect free.
