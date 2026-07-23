import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';

import type { DbRow, SortRule } from '../../types/api.types.js';
import type {
  CarSalesResponse,
  PaginatedCarSalesResponse,
} from './carSales.types.js';

import { resolveSortRules } from '../../utils/resolveSortRules.util.js';
import {
  CAR_SALES_COLUMNS,
  CAR_SALES_PRIMARY_KEY,
  CAR_SALES_SCHEMA,
  CAR_SALES_TABLE,
  DEFAULT_CAR_SALES_SORTING,
} from './carSales.constants.js';

export type CarSalesRepository = {
  readonly getAll: () => Promise<CarSalesResponse>;
  readonly getPaginated: (
    args: GetPaginatedCarSalesArgs,
  ) => Promise<PaginatedCarSalesResponse>;
};

type GetPaginatedCarSalesArgs = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

const TARGET = {
  schema: CAR_SALES_SCHEMA,
  table: CAR_SALES_TABLE,
} as const;

/**
 * Database access for car sales endpoints, composed entirely from the generic
 * `@lcabrera/server` executors (no hand-rolled SQL): `selectRows` for the page,
 * `getRowsCount` for the total. Both reach the `getPool()` singleton, so this
 * repository needs no injected pool.
 */
export const createCarSalesRepository = (): CarSalesRepository => ({
  getAll: async () => {
    const data = await selectRows<DbRow>({
      ...TARGET,
      fields: CAR_SALES_COLUMNS,
      sort: [{ column: CAR_SALES_PRIMARY_KEY, direction: 'asc' }],
    });

    return { data, total: data.length };
  },

  getPaginated: async ({ limit, skip, sorting }) => {
    const data = await selectRows<DbRow>({
      ...TARGET,
      allowedColumns: CAR_SALES_COLUMNS,
      fields: CAR_SALES_COLUMNS,
      limit,
      offset: skip,
      sort: resolveSortRules({
        fallbackSorting: DEFAULT_CAR_SALES_SORTING,
        sorting,
      }),
    });
    const total = await getRowsCount({
      ...TARGET,
      column: CAR_SALES_PRIMARY_KEY,
    });

    return {
      data,
      hasMore: skip + data.length < total,
      total,
    };
  },
});
