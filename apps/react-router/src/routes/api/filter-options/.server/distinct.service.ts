import type { FilterOptionsSources } from '@lcabrera/server/filters/resolve-filter-options-source.util';

import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { resolveFilterOptionsSource } from '@lcabrera/server/filters/resolve-filter-options-source.util';

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
    limit,
    offset,
    schema: schemaName,
    table: tableName,
  });
};
