import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';

import type { DbRow, SortRule } from '../../types/api.types.js';
import type {
  EnterpriseOrderDetailResponse,
  EnterpriseOrdersFilters,
  EnterpriseOrdersResponse,
} from './enterpriseOrders.types.js';

import { resolveSortRules } from '../../utils/resolveSortRules.util.js';
import {
  DEFAULT_ENTERPRISE_ORDER_SORTING,
  ENTERPRISE_ORDER_COLUMNS,
  ENTERPRISE_ORDER_PRIMARY_KEY,
  ENTERPRISE_ORDERS_SCHEMA,
  ENTERPRISE_ORDERS_TABLE,
} from './enterpriseOrders.constants.js';

export type EnterpriseOrdersRepository = {
  readonly getOrderById: (
    orderId: number,
  ) => Promise<EnterpriseOrderDetailResponse | undefined>;
  readonly getPaginated: (
    args: GetEnterpriseOrdersArgs,
  ) => Promise<EnterpriseOrdersResponse>;
};

type GetEnterpriseOrdersArgs = {
  readonly filters: EnterpriseOrdersFilters;
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

const TARGET = {
  allowedColumns: ENTERPRISE_ORDER_COLUMNS,
  schema: ENTERPRISE_ORDERS_SCHEMA,
  table: ENTERPRISE_ORDERS_TABLE,
} as const;

/**
 * Database access for enterprise-order endpoints, composed from the generic
 * `@lcabrera/server` executors and its filter subsystem: `toQueryFilters` maps
 * the table's typed column filters to the flat `QueryFilter[]` that `selectRows`
 * and `getRowsCount` share, so the page and its total can never drift. The same
 * mapping the React Router app uses, so all three consumers agree.
 */
export const createEnterpriseOrdersRepository =
  (): EnterpriseOrdersRepository => ({
    getOrderById: async (orderId) => {
      const rows = await selectRows<DbRow>({
        ...TARGET,
        fields: ENTERPRISE_ORDER_COLUMNS,
        filters: [
          {
            column: ENTERPRISE_ORDER_PRIMARY_KEY,
            operator: 'eq',
            value: orderId,
          },
        ],
        limit: 1,
      });
      const [row] = rows;

      return row ? { data: row } : undefined;
    },

    getPaginated: async ({ filters, limit, skip, sorting }) => {
      const queryFilters = toQueryFilters({ filters });

      const data = await selectRows<DbRow>({
        ...TARGET,
        fields: ENTERPRISE_ORDER_COLUMNS,
        filters: queryFilters,
        limit,
        offset: skip,
        sort: resolveSortRules({
          fallbackSorting: DEFAULT_ENTERPRISE_ORDER_SORTING,
          sorting,
        }),
      });
      const total = await getRowsCount({
        ...TARGET,
        column: ENTERPRISE_ORDER_PRIMARY_KEY,
        filters: queryFilters,
      });

      return {
        data,
        hasMore: skip + data.length < total,
        total,
      };
    },
  });
