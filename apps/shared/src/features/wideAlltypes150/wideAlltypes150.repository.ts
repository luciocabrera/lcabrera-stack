import type {
  CountRow,
  DbRow,
  PaginatedResponse,
  Queryable,
  SortRule,
} from '../../types/api.types.js';

import { buildOrderByClause } from '../../utils/buildOrderByClause.util.js';
import { serializeDatabaseValue } from '../../utils/serializeDatabaseValue.util.js';
import {
  DEFAULT_WIDE_ALLTYPES_SORTING,
  MAX_WIDE_ALLTYPES_SORT_RULES,
  WIDE_ALLTYPES_SORTABLE_COLUMNS,
} from './wideAlltypes150.constants.js';

export type WideAlltypes150Repository = {
  readonly getPaginated: (
    args: GetPaginatedWideAlltypes150Args,
  ) => Promise<PaginatedResponse<DbRow>>;
};

type CreateWideAlltypes150RepositoryArgs = {
  readonly pool: Queryable;
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
    const safeSorting = sorting
      .filter(({ columnKey }) => WIDE_ALLTYPES_SORTABLE_COLUMNS.has(columnKey))
      .slice(0, MAX_WIDE_ALLTYPES_SORT_RULES);

    const orderByClause = buildOrderByClause({
      allowedColumns: WIDE_ALLTYPES_SORTABLE_COLUMNS,
      fallbackSorting: DEFAULT_WIDE_ALLTYPES_SORTING,
      sorting: safeSorting,
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
