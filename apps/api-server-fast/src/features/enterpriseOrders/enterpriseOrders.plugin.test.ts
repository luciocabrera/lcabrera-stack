import type { EnterpriseOrdersFilters } from 'api-shared';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { ENTERPRISE_ORDER_FILTER_CONTRACT_CASES } from 'api-shared';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { EnvConfig } from '../../config/env.schema';

import { createApp } from '../../app/app';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);

const envConfig: EnvConfig = {
  API_PORT: 3001,
  DB_HOST: 'localhost',
  DB_NAME: 'test',
  DB_PASSWORD: 'test',
  DB_PORT: 5432,
  DB_USER: 'test',
  DISTINCT_VALUES_DELAY_MS: 0,
  ENTERPRISE_ORDERS_DELAY_MS: 0,
};

describe('enterpriseOrders fastify plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps a number filter to a generic QueryFilter shared by the page and its count', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: '/api/enterprise-orders/paginated?skip=0&limit=10&filter=%7B%22total_amount%22%3A%7B%22operator%22%3A%22lessThan%22%2C%22type%22%3A%22number%22%2C%22value%22%3A20%7D%7D',
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ column: 'total_amount', operator: 'lt', value: 20 }],
        limit: 10,
        offset: 0,
        schema: 'public',
        table: 'enterprise_orders',
      }),
    );
    expect(mockedGetRowsCount).toHaveBeenCalledWith(
      expect.objectContaining({
        column: 'order_id',
        filters: [{ column: 'total_amount', operator: 'lt', value: 20 }],
        schema: 'public',
        table: 'enterprise_orders',
      }),
    );

    await app.close();
  });

  /**
   * The `filter` payload this route's JSON Schema validates is also served,
   * unvalidated, by the React Router route (`_api/enterprise-orders/paginated`),
   * which hands the parsed JSON straight to `toQueryFilters`. The schema is a
   * third statement of a shape no type can check, so it is held in step
   * behaviourally: every state in the shared contract must reach the query
   * layer here with exactly the clauses that route would have built. A stricter
   * rule surfaces as a 400, a looser one as a different clause set.
   */
  it.each(ENTERPRISE_ORDER_FILTER_CONTRACT_CASES)(
    'accepts $name and builds the same clauses as the React Router route',
    async ({ filters }) => {
      mockedSelectRows.mockResolvedValue([]);
      mockedGetRowsCount.mockResolvedValue(0);

      const app = createApp({ envConfig });
      // The wire form, not the fixture object: JSON has no way to carry
      // `value: undefined`, so a drafting filter loses the key in transit and
      // that is the shape both routes actually receive.
      const wireFilters = JSON.stringify(filters);
      const routeFilters = JSON.parse(wireFilters) as EnterpriseOrdersFilters;

      const response = await app.inject({
        method: 'GET',
        url: `/api/enterprise-orders/paginated?filter=${encodeURIComponent(wireFilters)}`,
      });

      expect(response.statusCode).toBe(200);
      expect(mockedSelectRows).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: toQueryFilters({ filters: routeFilters }),
        }),
      );

      await app.close();
    },
  );

  it('still rejects an operator outside the contract', async () => {
    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/enterprise-orders/paginated?filter=${encodeURIComponent(
        JSON.stringify({
          total_amount: { operator: 'divides', type: 'number' },
        }),
      )}`,
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });
});
