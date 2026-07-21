import { buildDistinctQuery } from '@repo/server/db/query-builder/build-distinct-query.util';

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
 * composed by @repo/server's buildDistinctQuery.
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

    const query = buildDistinctQuery({
      allowedColumns: source.allowedColumns,
      column: source.columnName,
      limit,
      offset,
      schema: source.schemaName,
      table: source.tableName,
    });
    const params = query.values as readonly QueryValue[];

    console.warn(
      '🎯 [Distinct] Query:',
      formatPgAdminQuery(query.text, params),
    );

    const result = await pool.query<{ readonly value: string }>(
      query.text,
      params,
    );
    const values = result.rows.map(({ value }) => value);

    return {
      hasMore: values.length === limit,
      values,
    };
  },
});
