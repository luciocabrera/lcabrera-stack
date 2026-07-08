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

`EnterpriseOrders.component.tsx` passes `columnsState` (including `COLUMNS`)
straight from the loader into `TableLayout` — there is no client-side
rehydration step. The synthesized actions column is static + non-resizable +
non-filterable by default, which prevents unpinning and width changes from UI
controls.

The actions-cell link content is center-aligned via route-local StyleX styles
so the icon button remains visually centered in the narrow pinned actions
column.

## Duplication Guardrail

- Repeated distinct-filter string columns are composed through `createDistinctStringColumn(...)` from `@repo/ui/components/Table/utils` in [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx).
- This keeps `columnName` + `fetchDistinctValues` wiring consistent across customer and shipping fields while preserving each column's label/width metadata.
- The row-actions column is likewise never hand-declared here — it's synthesized by `TableConfigProvider` (via `getInitialColumnsState` / `resolveTableActionsColumn`) from `CRUD`, keeping store initialization explicit and side-effect free.
