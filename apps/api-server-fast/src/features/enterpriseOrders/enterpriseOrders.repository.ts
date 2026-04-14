import type { Pool } from 'pg';

import { buildOrderByClause } from '../../utils/buildOrderByClause.util';
import { formatPgAdminQuery } from '../../utils/formatPgAdminQuery.util';
import type { CountRow, DbRow, QueryValue, SortRule } from 'api-shared';

import { buildEnterpriseOrdersWhereClause } from './buildEnterpriseOrdersWhereClause.util';
import { DEFAULT_ENTERPRISE_ORDER_SORTING } from './enterpriseOrders.constants';
import type {
  EnterpriseOrderDetailResponse,
  EnterpriseOrdersDistinctResponse,
  EnterpriseOrdersFilters,
  EnterpriseOrdersResponse,
} from './enterpriseOrders.types';

export type EnterpriseOrdersRepository = {
  readonly getDistinctValues: (
    args: GetDistinctValuesArgs,
  ) => Promise<EnterpriseOrdersDistinctResponse>;
  readonly getOrderById: (
    orderId: number,
  ) => Promise<EnterpriseOrderDetailResponse | undefined>;
  readonly getPaginated: (
    args: GetEnterpriseOrdersArgs,
  ) => Promise<EnterpriseOrdersResponse>;
};

type CreateEnterpriseOrdersRepositoryArgs = {
  readonly pool: Pool;
};

type GetDistinctValuesArgs = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
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
  getDistinctValues: async ({ columnName, limit, offset }) => {
    const query = `
      SELECT DISTINCT ${columnName} AS value
      FROM enterprise_orders
      WHERE ${columnName} IS NOT NULL AND ${columnName} != ''
      ORDER BY ${columnName}
      LIMIT $1 OFFSET $2
    `;
    const params: QueryValue[] = [limit, offset];

    console.warn('🎯 [Distinct] Query:', formatPgAdminQuery(query, params));

    const result = await pool.query<{ readonly value: string }>(query, params);
    const values = result.rows.map(({ value }) => value);

    return {
      hasMore: values.length === limit,
      values,
    };
  },

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
