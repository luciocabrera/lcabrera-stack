import type { EnterpriseOrdersFilters } from 'api-shared';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { MAX_ENTERPRISE_ORDERS_LIMIT } from 'api-shared';
import { ENTERPRISE_ORDER_FILTER_CONTRACT_CASES } from 'api-shared/filter-contract';
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

/**
 * The mid-edit states #567 was filed for, written out here rather than read
 * from the shared contract cases.
 *
 * That set anchors each filter variant's keys to the variant's own operator
 * union, so an operator cannot go unchecked. Its `drafting` group has no such
 * anchor — "a value the mappers drop" spans an absent key, an empty string and
 * an empty array, which share no closed vocabulary — so a case deleted from it
 * stops being checked and nothing fails. This is the copy that makes such a
 * deletion visible on this server: a named regression someone has to delete
 * deliberately.
 */
const DRAFTING_FILTERS = [
  {
    filters: { total_amount: { operator: 'equals', type: 'number' } },
    name: 'a number filter the user has not finished typing',
  },
  {
    filters: {
      total_amount: { operator: 'between', type: 'number', value: 10 },
    },
    name: 'a number range with no second bound yet',
  },
  {
    filters: {
      customer_name: { operator: 'contains', type: 'text', value: '' },
    },
    name: 'a text filter whose box has been cleared',
  },
  {
    filters: { order_date: { operator: 'after', type: 'date', value: '' } },
    name: 'a date filter with no date picked',
  },
  {
    filters: {
      payment_status: { operator: 'equals', type: 'select', value: '' },
    },
    name: 'a select filter with nothing chosen',
  },
  {
    filters: {
      order_status: { operator: 'equals', type: 'multiSelect', values: [] },
    },
    name: 'a multi-select filter with every option deselected',
  },
] as const;

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

  it.each(DRAFTING_FILTERS)(
    'accepts $name and builds no clause for it',
    async ({ filters }) => {
      mockedSelectRows.mockResolvedValue([]);
      mockedGetRowsCount.mockResolvedValue(0);

      const app = createApp({ envConfig });

      const response = await app.inject({
        method: 'GET',
        url: `/api/enterprise-orders/paginated?filter=${encodeURIComponent(JSON.stringify(filters))}`,
      });

      expect(response.statusCode).toBe(200);
      expect(mockedSelectRows).toHaveBeenCalledWith(
        expect.objectContaining({ filters: [] }),
      );

      await app.close();
    },
  );

  /**
   * Fastify bounds the page window by *rejecting* the request in the route's
   * query schema, where its other constraints already live — the Express server
   * clamps instead. The divergence is deliberate and predates this bound:
   * `wideAlltypes150` has always answered this way on each server, and the two
   * exist to be compared, so each keeps its own idiom.
   */
  it('rejects a limit above MAX_ENTERPRISE_ORDERS_LIMIT with 400', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/enterprise-orders/paginated?skip=0&limit=${MAX_ENTERPRISE_ORDERS_LIMIT + 1}`,
    });

    expect(response.statusCode).toBe(400);
    // The read must never start: a 400 alongside a whole-table query would
    // still have served the request this bound exists to refuse.
    expect(mockedSelectRows).not.toHaveBeenCalled();

    await app.close();
  });

  it('serves a limit exactly at the ceiling', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);

    const app = createApp({ envConfig });

    const response = await app.inject({
      method: 'GET',
      url: `/api/enterprise-orders/paginated?skip=0&limit=${MAX_ENTERPRISE_ORDERS_LIMIT}`,
    });

    expect(response.statusCode).toBe(200);
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({ limit: MAX_ENTERPRISE_ORDERS_LIMIT }),
    );

    await app.close();
  });

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
