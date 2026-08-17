import type { FilterOptionsSources } from '@lcabrera/server/filters/resolve-filter-options-source.util';

import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { resolveFilterOptionsSource } from '@lcabrera/server/filters/resolve-filter-options-source.util';

import { MAX_FILTER_OPTIONS_LIMIT } from '@/routes/api/filter-options/filter-options.constants';
import {
  CAR_SALES_DISTINCT_FILTER_COLUMNS,
  CAR_SALES_SCHEMA,
  CAR_SALES_TABLE,
} from '@/routes/car-sales/config';
import {
  ENTERPRISE_ORDER_DISTINCT_FILTER_COLUMNS,
  ENTERPRISE_ORDERS_SCHEMA,
  ENTERPRISE_ORDERS_TABLE,
} from '@/routes/enterprise-orders/config';

/**
 * Server-only distinct-values access for the same-origin `/_api/filter-options`
 * loader — the filter-dropdown equivalent of `.server/enterpriseOrders.service.ts`.
 *
 * Delegates both halves to `@lcabrera/server`: `resolveFilterOptionsSource`
 * authorizes the request against the registry below, `selectFilterOptions` runs
 * the read. This file supplies only the app's specifics — which `schema.table`s
 * expose which columns, and each column's `ColumnType` — sourced from the
 * per-entity `config/` modules, so the allow-list is never duplicated here (each
 * entity owns its own, next to its schema/table).
 *
 * Lives in `.server/` so it can never enter the client bundle (it reaches the
 * pool through the package helper); import it only from the loader.
 */

/** `schema.table` → (allow-listed column → its predicate column type). */
const DISTINCT_SOURCES: FilterOptionsSources = {
  [`${CAR_SALES_SCHEMA}.${CAR_SALES_TABLE}`]: CAR_SALES_DISTINCT_FILTER_COLUMNS,
  [`${ENTERPRISE_ORDERS_SCHEMA}.${ENTERPRISE_ORDERS_TABLE}`]:
    ENTERPRISE_ORDER_DISTINCT_FILTER_COLUMNS,
};

type SelectDistinctFilterOptionsArgs = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * Reads one page of a column's distinct values for a filter dropdown. Returns
 * `undefined` when the source or column is not allow-listed — the loader maps
 * that to a 400 — so an unknown column never reaches SQL. The column's
 * `ColumnType` (from config) drives which values count as meaningful; `hasMore`
 * follows the page-size convention.
 *
 * **The request-derived window is bounded here, not in the route's parser**
 * (#736), for the reason #706 gives at `selectOrdersPage`: this function is what
 * every entry point reaches, so one clamp here is complete, while a clamp in
 * `parseFilterOptionsParams` would bound only callers that route through it —
 * and that parser is published in `@lcabrera/api`, so a ceiling there would also
 * decide the bound on behalf of consumers outside this repository.
 *
 * `LIMIT 0` is floored to 1 for a second reason: `hasMore` is
 * `values.length === limit`, so a zero-width page reports `0 === 0` — an empty
 * result that claims another page follows, which is a dropdown that pages
 * forever without ever showing a value.
 *
 * `offset` is deliberately not bounded: one past the end returns an empty page
 * after work bounded by the column rather than by the request.
 */
export const selectDistinctFilterOptions = async ({
  columnName,
  limit,
  offset,
  schemaName,
  tableName,
}: SelectDistinctFilterOptionsArgs) => {
  const source = resolveFilterOptionsSource({
    column: columnName,
    schema: schemaName,
    sources: DISTINCT_SOURCES,
    table: tableName,
  });

  if (!source.allowed) {
    return;
  }

  return selectFilterOptions({
    allowedColumns: source.allowedColumns,
    column: columnName,
    columnType: source.columnType,
    limit: Math.min(MAX_FILTER_OPTIONS_LIMIT, Math.max(1, limit)),
    offset,
    schema: schemaName,
    table: tableName,
  });
};
