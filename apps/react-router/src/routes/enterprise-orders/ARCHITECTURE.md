# Enterprise Orders Route Architecture

Enterprise table route for large-order operational data with a dedicated constants map for column behavior.

## Purpose

- Expose `/enterprise-orders` as a table-centric operational view.
- Configure table columns, pinning defaults, and route-specific rendering behavior.
- Keep route wiring (`loader`, `meta`, `layout`, `errorBoundary`) local to this folder.

## Constants Responsibilities

The file [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx) owns:

- `PERSISTENCE_KEY` used by the table persistence layer.
- `DEFAULT_COLUMN_PINNING` route default pinning (`actions` pinned right).
- `COLUMNS` definitions, including filter adapters and the row-level actions button.

The route loader also uses `COLUMNS` as the source of truth for standalone URL filter validation, so mismatched filter payloads are discarded before the enterprise orders API request is built.

Because route-loader payloads must stay serializable, the loader returns an empty
`columnsState.columns` array and preserves only serializable slices (filters,
sorting, order, sizing, visibility, pinning).

`EnterpriseOrders.component.tsx` rehydrates `columnsState.columns` via
`hydrateEnterpriseOrdersColumnsState(...)` before passing state to `TableLayout`.
This restores non-serializable client concerns (for example the actions-cell
`render` function and filter option callbacks) while keeping loader data safe
for SSR/hydration boundaries.

The hydration utility also normalizes pinning so `actions` is always pinned on
the right, and the column definition itself is marked static + non-resizable,
which prevents unpinning and width changes from UI controls.

The actions-cell link content is center-aligned via route-local StyleX styles
so the icon button remains visually centered in the narrow pinned actions
column.

## Duplication Guardrail

- Repeated distinct-filter string columns are composed through `createDistinctStringColumn(...)` in [src/routes/enterprise-orders/EnterpriseOrders.constants.tsx](src/routes/enterprise-orders/EnterpriseOrders.constants.tsx).
- This keeps `columnName` + `fetchDistinctValues` wiring consistent across customer and shipping fields while preserving each column's label/width metadata.
- The client-side hydration path now lives in the loader rather than `TableConfigProvider`, which keeps store initialization explicit and side-effect free.
