import { buildDistinctQuery } from '@lcabrera/server/db/query-builder/build-distinct-query.util';

import type {
  DistinctValuesResponse,
  Queryable,
  QueryValue,
} from '../../types/api.types.js';

import { formatPgAdminQuery } from '../../utils/formatPgAdminQuery.util.js';
import { parseDistinctSource } from './parseDistinctSource.util.js';

export type DistinctRepository = {
  readonly getDistinctValues: (
    args: GetDistinctValuesArgs,
  ) => Promise<DistinctValuesResponse>;
};

type CreateDistinctRepositoryArgs = {
  readonly pool: Queryable;
};

type GetDistinctValuesArgs = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * Generic distinct-values access behind /api/distinct: allow-list
 * validation via parseDistinctSource, then a parameterized SELECT DISTINCT
 * composed by @lcabrera/server's buildDistinctQuery.
 */
export const createDistinctRepository = ({
  pool,
}: CreateDistinctRepositoryArgs): DistinctRepository => ({
  getDistinctValues: async ({
    columnName,
    limit,
    offset,
    schemaName,
    tableName,
  }) => {
    const source = parseDistinctSource({ columnName, schemaName, tableName });

    // Mirrors @lcabrera/server's selectFilterOptions, but composed onto this
    // app's injected pool rather than the getPool singleton (unifying the two is
    // #352). Every distinct source here is a text column, so a bare empty-string
    // `neq` is safe (no cast needed).
    const query = buildDistinctQuery({
      allowedColumns: source.allowedColumns,
      fields: [source.columnName],
      filters: [
        { column: source.columnName, operator: 'isNotNull' },
        { column: source.columnName, operator: 'neq', value: '' },
      ],
      limit,
      offset,
      schema: source.schemaName,
      sort: [{ column: source.columnName, direction: 'asc' }],
      table: source.tableName,
    });
    const params = query.values as readonly QueryValue[];

    console.warn(
      '🎯 [Distinct] Query:',
      formatPgAdminQuery(query.text, params),
    );

    const result = await pool.query<Record<string, string>>(query.text, params);
    const values = result.rows
      .map((row) => row[source.columnName])
      .filter((value): value is string => value !== undefined);

    return {
      hasMore: values.length === limit,
      values,
    };
  },
});
