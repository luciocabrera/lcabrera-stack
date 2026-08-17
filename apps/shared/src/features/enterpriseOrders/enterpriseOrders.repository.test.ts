import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MAX_ENTERPRISE_ORDERS_SORT_RULES } from './enterpriseOrders.constants.js';
import { createEnterpriseOrdersRepository } from './enterpriseOrders.repository.js';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);

describe('createEnterpriseOrdersRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPaginated truncates the ORDER BY at MAX_ENTERPRISE_ORDERS_SORT_RULES', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createEnterpriseOrdersRepository();
    const oversizedSorting = Array.from(
      { length: MAX_ENTERPRISE_ORDERS_SORT_RULES + 10 },
      () => ({ columnKey: 'order_status', direction: 'asc' }) as const,
    );

    await repository.getPaginated({
      filters: {},
      limit: 50,
      skip: 0,
      sorting: oversizedSorting,
    });

    const [call] = mockedSelectRows.mock.calls;
    expect(call?.[0].sort).toHaveLength(MAX_ENTERPRISE_ORDERS_SORT_RULES);
  });

  it('getPaginated forwards an ordinary multi-column sort unchanged', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createEnterpriseOrdersRepository();

    await repository.getPaginated({
      filters: {},
      limit: 50,
      skip: 0,
      sorting: [
        { columnKey: 'order_status', direction: 'desc' },
        { columnKey: 'customer_name', direction: 'asc' },
      ],
    });

    // Exact equality, not a length: a bound that also truncated a legitimate
    // sort would be a different bug, and a length assertion would miss it.
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [
          { column: 'order_status', direction: 'desc' },
          { column: 'customer_name', direction: 'asc' },
        ],
      }),
    );
  });

  it('getPaginated falls back to the default sort when the request has none', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createEnterpriseOrdersRepository();

    await repository.getPaginated({
      filters: {},
      limit: 50,
      skip: 0,
      sorting: [],
    });

    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ column: 'order_id', direction: 'desc' }],
      }),
    );
  });
});
