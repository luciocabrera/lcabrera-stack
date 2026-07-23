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
 * Distinct-values access behind /api/distinct. Authorization stays here —
 * parseDistinctSource enforces the schema/table + column allow-list, which the
 * package helper does not (it only allow-lists the column) — then the distinct
 * read itself is @lcabrera/server's selectFilterOptions, sharing the getPool()
 * singleton both api-servers now source their pool from. No injected pool: with
 * one shared singleton there is nothing to inject. Every allow-listed source is
 * a text column, so columnType is 'text' (which also drops the empty string).
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
      columnType: 'text',
      limit,
      offset,
      schema: source.schemaName,
      table: source.tableName,
    });
  },
});
