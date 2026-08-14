import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';

import type { DistinctValuesResponse } from '../../types/api.types.js';

import { parseDistinctSource } from './parseDistinctSource.util.js';

export type DistinctRepository = {
  readonly getDistinctValues: (
    args: GetDistinctValuesArgs,
  ) => Promise<DistinctValuesResponse>;
};

type GetDistinctValuesArgs = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * Distinct-values access behind /api/distinct. Authorization runs first —
 * parseDistinctSource resolves the request against the DISTINCT_SOURCES
 * registry, which selectFilterOptions cannot do for itself (it takes
 * schema/table as data and allow-lists only the column) — then the distinct
 * read itself is @lcabrera/server's selectFilterOptions, sharing the getPool()
 * singleton both api-servers now source their pool from. No injected pool: with
 * one shared singleton there is nothing to inject. The registry carries each
 * column's type, so the empty-string exclusion follows the column rather than a
 * hard-coded 'text'.
 */
export const createDistinctRepository = (): DistinctRepository => ({
  getDistinctValues: async ({
    columnName,
    limit,
    offset,
    schemaName,
    tableName,
  }) => {
    const source = parseDistinctSource({ columnName, schemaName, tableName });

    return selectFilterOptions({
      allowedColumns: source.allowedColumns,
      column: source.columnName,
      columnType: source.columnType,
      limit,
      offset,
      schema: source.schemaName,
      table: source.tableName,
    });
  },
});
