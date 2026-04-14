import type { Pool } from 'pg';

import { buildOrderByClause } from '../../utils/buildOrderByClause.util';

import { DEFAULT_CAR_SALES_SORTING } from './carSales.constants';
import type {
  CarSalesResponse,
  PaginatedCarSalesResponse,
} from './carSales.types';
import type { SortRule } from 'api-shared';

export type CarSalesRepository = {
  readonly getAll: () => Promise<CarSalesResponse>;
  readonly getPaginated: (
    args: GetPaginatedCarSalesArgs,
  ) => Promise<PaginatedCarSalesResponse>;
};

type CreateCarSalesRepositoryArgs = {
  readonly pool: Pool;
};

type GetPaginatedCarSalesArgs = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

/**
 * Database access for car sales endpoints.
 */
export const createCarSalesRepository = ({
  pool,
}: CreateCarSalesRepositoryArgs): CarSalesRepository => ({
  getAll: async () => {
    const result = await pool.query('SELECT * FROM car_sales ORDER BY car_id');

    return {
      data: result.rows,
      total: result.rowCount ?? result.rows.length,
    };
  },

  getPaginated: async ({ limit, skip, sorting }) => {
    const orderByClause = buildOrderByClause({
      fallbackSorting: DEFAULT_CAR_SALES_SORTING,
      sorting,
    });

    const dataResult = await pool.query(
      `SELECT * FROM car_sales ${orderByClause} LIMIT $1 OFFSET $2`,
      [limit, skip],
    );
    const countResult = await pool.query<{ readonly count: string }>(
      'SELECT COUNT(*) FROM car_sales',
    );
    const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);

    return {
      data: dataResult.rows,
      hasMore: skip + dataResult.rows.length < total,
      total,
    };
  },
});
