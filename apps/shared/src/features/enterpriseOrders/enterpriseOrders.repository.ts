import type {
  CountRow,
  DbRow,
  Queryable,
  QueryValue,
  SortRule,
} from '../../types/api.types.js';
import type {
  EnterpriseOrderDetailResponse,
  EnterpriseOrdersFilters,
  EnterpriseOrdersResponse,
} from './enterpriseOrders.types.js';

import { buildOrderByClause } from '../../utils/buildOrderByClause.util.js';
import { formatPgAdminQuery } from '../../utils/formatPgAdminQuery.util.js';
import { buildEnterpriseOrdersWhereClause } from './buildEnterpriseOrdersWhereClause.util.js';
import { DEFAULT_ENTERPRISE_ORDER_SORTING } from './enterpriseOrders.constants.js';

export type EnterpriseOrdersRepository = {
  readonly getOrderById: (
    orderId: number,
  ) => Promise<EnterpriseOrderDetailResponse | undefined>;
  readonly getPaginated: (
    args: GetEnterpriseOrdersArgs,
  ) => Promise<EnterpriseOrdersResponse>;
};

type CreateEnterpriseOrdersRepositoryArgs = {
  readonly pool: Queryable;
};

type GetEnterpriseOrdersArgs = {
  readonly filters: EnterpriseOrdersFilters;
  readonly limit: number;
  readonly skip: number;
  readonly sorting: readonly SortRule[];
};

/**
 * Database access for enterprise-order endpoints.
 */
export const createEnterpriseOrdersRepository = ({
  pool,
}: CreateEnterpriseOrdersRepositoryArgs): EnterpriseOrdersRepository => ({
  getOrderById: async (orderId) => {
    const query = 'SELECT * FROM enterprise_orders WHERE order_id = $1';
    const params: QueryValue[] = [orderId];

    console.warn('📦 [Order Detail] Query:', formatPgAdminQuery(query, params));

    const result = await pool.query<DbRow>(query, params);
    const [row] = result.rows;

    if (!row) {
      return;
    }

    return {
      data: row,
    };
  },

  getPaginated: async ({ filters, limit, skip, sorting }) => {
    const orderByClause = buildOrderByClause({
      fallbackSorting: DEFAULT_ENTERPRISE_ORDER_SORTING,
      sorting,
    });
    const whereClauseResult = buildEnterpriseOrdersWhereClause(filters);
    const dataQuery = `SELECT * FROM enterprise_orders ${whereClauseResult.whereClause} ${orderByClause} LIMIT $${whereClauseResult.queryParams.length + 1} OFFSET $${whereClauseResult.queryParams.length + 2}`;
    const countQuery = `SELECT COUNT(*) FROM enterprise_orders ${whereClauseResult.whereClause}`;
    const dataParams: QueryValue[] = [
      ...whereClauseResult.queryParams,
      limit,
      skip,
    ];

    console.warn(
      '📦 [Orders] Data Query:',
      formatPgAdminQuery(dataQuery, dataParams),
    );
    console.warn(
      '📦 [Orders] Count Query:',
      formatPgAdminQuery(countQuery, whereClauseResult.queryParams),
    );

    const dataResult = await pool.query<DbRow>(dataQuery, dataParams);
    const countResult = await pool.query<CountRow>(countQuery, [
      ...whereClauseResult.queryParams,
    ]);
    const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10);

    return {
      data: dataResult.rows,
      hasMore: skip + dataResult.rows.length < total,
      total,
    };
  },
});
