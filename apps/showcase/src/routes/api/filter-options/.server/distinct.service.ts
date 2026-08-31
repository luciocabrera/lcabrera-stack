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
