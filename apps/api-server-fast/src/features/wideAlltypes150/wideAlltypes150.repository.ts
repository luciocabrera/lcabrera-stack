import type { Pool } from 'pg';

import { buildOrderByClause } from '../../utils/buildOrderByClause.util';
import { serializeDatabaseValue } from 'api-shared/utils/serializeDatabaseValue.util';
import type { CountRow, DbRow, PaginatedResponse, SortRule } from 'api-shared';

import { DEFAULT_WIDE_ALLTYPES_SORTING } from './wideAlltypes150.constants';

export type WideAlltypes150Repository = {
  readonly getPaginated: (
    args: GetPaginatedWideAlltypes150Args,
  ) => Promise<PaginatedResponse<DbRow>>;
};

type CreateWideAlltypes150RepositoryArgs = {
  readonly pool: Pool;
};

type GetPaginatedWideAlltypes150Args = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

/**
 * Database access for wide-alltypes endpoints.
 */
export const createWideAlltypes150Repository = ({
  pool,
}: CreateWideAlltypes150RepositoryArgs): WideAlltypes150Repository => ({
  getPaginated: async ({ limit, skip, sorting }) => {
    const orderByClause = buildOrderByClause({
      fallbackSorting: DEFAULT_WIDE_ALLTYPES_SORTING,
      sorting,
    });
    const dataResult = await pool.query<DbRow>(
      `SELECT * FROM wide_alltypes_150 ${orderByClause} LIMIT $1 OFFSET $2`,
      [limit, skip],
    );
    const rows = dataResult.rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          serializeDatabaseValue(value),
        ]),
      ),
    );
    const countResult = await pool.query<CountRow>(
      'SELECT COUNT(*) FROM wide_alltypes_150',
    );
    const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);

    return {
      data: rows,
      hasMore: skip + rows.length < total,
      total,
    };
  },
});
