import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { loader as paginatedLoader } from '@/routes/api/enterprise-orders-paginated/enterprise-orders-paginated.loader';
import {
  MAX_ENTERPRISE_ORDERS_LIMIT,
  MAX_ENTERPRISE_ORDERS_SORT_RULES,
} from '@/routes/enterprise-orders/config';
import { loader as ssrLoader } from '@/routes/enterprise-orders/enterprise-orders.loader';

import { selectOrdersPage } from './enterpriseOrders.service';

/**
 * Everything that can size a read of `enterprise_orders`, checked at the point
 * the size reaches SQL rather than at the point it is parsed (#706).
 *
 * **Why this file exists at all.** `/_api/enterprise-orders/paginated` takes its
 * window from search params; the route's SSR loader takes its own from
 * `INITIAL_PAGE_SIZE`. Only the first passes through `parseOrdersPageParams`, so
 * a test that watched the parser clamp would say nothing about the other half of
 * the surface — the trap #701 hit on the sibling route, where a parser-only fix
 * looked complete and left the SSR path uncapped. Both entry points are driven
 * here, and the only thing mocked is the `@lcabrera/server` executor layer, so
 * what is asserted is the descriptor the query builder would have run.
 *
 * **What discriminates.** The resource-route cases ask for a window and an
 * ORDER BY larger than the bounds allow; with the clamps removed from
 * `selectOrdersPage` each one reaches the executor exactly as asked, so each
 * goes red. The SSR cases are two halves of one claim: the request cannot size
 * that read (it would go red if a later change wired the window to the URL), and
 * the function it reads through clamps whatever window it is handed (it goes red
 * if the clamp is removed). A happy-path `limit=50` case would pass identically
 * with and without the fix and is deliberately not the evidence here.
 *
 * The whole file is bounds only. That the two entry points return the right rows
 * is `enterprise-orders.loader.test.ts` and
 * `enterprise-orders-paginated.loader.test.ts`, which mock this service out.
 */

vi.mock('@lcabrera/server/db/delete-rows.util', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('@lcabrera/server/db/get-column-grouping-capabilities.util', () => ({
  getColumnGroupingCapabilities: vi.fn(async () => ({})),
}));
vi.mock('@lcabrera/server/db/get-max-value.util', () => ({
  getMaxValue: vi.fn(async () => 41),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 500_000),
}));
vi.mock('@lcabrera/server/db/insert-row.util', () => ({
  insertRow: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/select-grouped-rows.util', () => ({
  selectGroupedRows: vi.fn(async () => ({
    aggregates: [{ alias: 'count_rows', fn: 'count' }],
    groupingSetMasks: [0],
    keys: [],
    maskAlias: 'group_mask',
    rows: [],
  })),
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(async () => [{ order_id: 7 }]),
}));
vi.mock('@lcabrera/server/db/update-rows.util', () => ({
  updateRows: vi.fn(async () => [{ order_id: 7 }]),
}));

const firstSelectDescriptor = () => vi.mocked(selectRows).mock.calls[0]?.[0];

const repeatedSortParam = (length: number) => {
  const rules = Array.from({ length }, () => ({
    columnKey: 'order_id',
    direction: 'asc',
  }));

  return encodeURIComponent(JSON.stringify(rules));
};

const getPaginated = async (search: string) =>
  paginatedLoader({
    request: new Request(
      `http://localhost/_api/enterprise-orders/paginated?${search}`,
    ),
  } as Parameters<typeof paginatedLoader>[0]);

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
  vi.mocked(getColumnGroupingCapabilities).mockClear();
});

describe('the resource route — GET /_api/enterprise-orders/paginated', () => {
  it('serves no more than the ceiling however large a limit is asked for', async () => {
    await getPaginated('limit=999999999&skip=0');

    expect(firstSelectDescriptor()?.limit).toBe(MAX_ENTERPRISE_ORDERS_LIMIT);
  });

  it('truncates an ORDER BY longer than the table has columns', async () => {
    const sort = repeatedSortParam(MAX_ENTERPRISE_ORDERS_SORT_RULES + 25);

    await getPaginated(`limit=50&skip=0&sort=${sort}`);

    expect(firstSelectDescriptor()?.sort).toHaveLength(
      MAX_ENTERPRISE_ORDERS_SORT_RULES,
    );
  });

  it('leaves a load-more the table itself sends alone', async () => {
    const response = await getPaginated('limit=50&skip=100');

    const descriptor = firstSelectDescriptor();

    expect(descriptor?.limit).toBe(50);
    expect(descriptor?.offset).toBe(100);
    expect(descriptor?.sort).toStrictEqual([
      { column: 'order_id', direction: 'asc' },
    ]);
    expect(getRowsCount).not.toHaveBeenCalled();
    expect(await response.json()).toStrictEqual({
      data: [{ order_id: 7 }],
      hasMore: false,
    });
  });
});

describe('the SSR path — GET /enterprise-orders', () => {
  it('sizes its first page itself, and a limit in the URL cannot widen it', async () => {
    const result = await ssrLoader({
      request: new Request(
        'http://localhost/enterprise-orders?limit=999999999',
      ),
    } as Parameters<typeof ssrLoader>[0]);

    await result.dataPromise;

    expect(firstSelectDescriptor()?.limit).toBe(INITIAL_PAGE_SIZE);
    expect(firstSelectDescriptor()?.limit).toBeLessThanOrEqual(
      MAX_ENTERPRISE_ORDERS_LIMIT,
    );
  });

  it('reads through a function that clamps whatever window it is handed', async () => {
    await selectOrdersPage({
      filters: [],
      includeTotal: true,
      limit: 999_999_999,
      offset: 0,
      sort: [{ column: 'order_id', direction: 'asc' }],
    });

    expect(firstSelectDescriptor()?.limit).toBe(MAX_ENTERPRISE_ORDERS_LIMIT);
  });
});
