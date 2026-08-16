import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MAX_CAR_SALES_SORT_RULES } from './carSales.constants.js';
import { createCarSalesRepository } from './carSales.repository.js';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);

describe('createCarSalesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll reads every column ordered by the primary key', async () => {
    mockedSelectRows.mockResolvedValue([{ car_id: 1 }]);
    const repository = createCarSalesRepository();

    const result = await repository.getAll();

    expect(mockedSelectRows).toHaveBeenCalledWith({
      fields: expect.arrayContaining(['car_id', 'model', 'buyer_name']),
      schema: 'public',
      sort: [{ column: 'car_id', direction: 'asc' }],
      table: 'car_sales',
    });
    expect(result).toEqual({ data: [{ car_id: 1 }], total: 1 });
  });

  it('getPaginated composes selectRows + getRowsCount and reports hasMore', async () => {
    mockedSelectRows.mockResolvedValue([{ car_id: 1 }, { car_id: 2 }]);
    mockedGetRowsCount.mockResolvedValue(10);
    const repository = createCarSalesRepository();

    const result = await repository.getPaginated({
      limit: 2,
      skip: 4,
      sorting: [{ columnKey: 'color', direction: 'desc' }],
    });

    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 4,
        schema: 'public',
        sort: [{ column: 'color', direction: 'desc' }],
        table: 'car_sales',
      }),
    );
    expect(mockedGetRowsCount).toHaveBeenCalledWith({
      column: 'car_id',
      schema: 'public',
      table: 'car_sales',
    });
    expect(result).toEqual({
      data: [{ car_id: 1 }, { car_id: 2 }],
      hasMore: true,
      total: 10,
    });
  });

  it('getPaginated falls back to the default sort when the request has none', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createCarSalesRepository();

    await repository.getPaginated({ limit: 50, skip: 0, sorting: [] });

    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ column: 'car_id', direction: 'asc' }],
      }),
    );
  });

  it('getPaginated truncates the ORDER BY at MAX_CAR_SALES_SORT_RULES', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createCarSalesRepository();
    const oversizedSorting = Array.from(
      { length: MAX_CAR_SALES_SORT_RULES + 10 },
      () => ({ columnKey: 'color', direction: 'asc' }) as const,
    );

    await repository.getPaginated({
      limit: 50,
      skip: 0,
      sorting: oversizedSorting,
    });

    const [call] = mockedSelectRows.mock.calls;
    expect(call?.[0].sort).toHaveLength(MAX_CAR_SALES_SORT_RULES);
  });

  it('getPaginated forwards an ordinary multi-column sort unchanged', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createCarSalesRepository();

    await repository.getPaginated({
      limit: 50,
      skip: 0,
      sorting: [
        { columnKey: 'color', direction: 'desc' },
        { columnKey: 'model', direction: 'asc' },
      ],
    });

    // Exact equality, not a length: a bound that also truncated a legitimate
    // sort would be a different bug, and a length assertion would miss it.
    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [
          { column: 'color', direction: 'desc' },
          { column: 'model', direction: 'asc' },
        ],
      }),
    );
  });
});
