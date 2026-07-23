import type { ColumnType } from '@lcabrera/server/db/query-builder/query-builder.types';

import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';

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
 * Delegates the build→run→shape to `@lcabrera/server`'s `selectFilterOptions`;
 * this file supplies only the app's specifics — which `schema.table`s expose
 * which columns, and each column's `ColumnType` — sourced from the per-entity
 * `config/` modules, so the allow-list is never duplicated here (each entity
 * owns its own, next to its schema/table).
 *
 * Lives in `.server/` so it can never enter the client bundle (it reaches the
 * pool through the package helper); import it only from the loader.
 */

/** `schema.table` → (allow-listed column → its predicate column type). */
const DISTINCT_SOURCES: Readonly<
  Record<string, Readonly<Record<string, ColumnType>>>
> = {
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
  const columns = DISTINCT_SOURCES[`${schemaName}.${tableName}`];

  if (columns === undefined) {
    return;
  }

  const columnType = columns[columnName];

  if (columnType === undefined) {
    return;
  }

  return selectFilterOptions({
    allowedColumns: Object.keys(columns),
    column: columnName,
    columnType,
    limit,
    offset,
    schema: schemaName,
    table: tableName,
  });
};
