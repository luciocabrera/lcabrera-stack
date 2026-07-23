import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createDbSanityRepository } from './dbSanity.repository.js';

vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedGetRowsCount = vi.mocked(getRowsCount);

describe('createDbSanityRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts each sanity table by its primary key and reports healthy', async () => {
    mockedGetRowsCount.mockResolvedValue(5);
    const repository = createDbSanityRepository();

    const result = await repository.getDbSanity();

    expect(mockedGetRowsCount).toHaveBeenCalledWith({
      column: 'car_id',
      schema: 'public',
      table: 'car_sales',
    });
    expect(mockedGetRowsCount).toHaveBeenCalledWith({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });
    expect(mockedGetRowsCount).toHaveBeenCalledWith({
      column: 'id',
      schema: 'public',
      table: 'wide_alltypes_150',
    });
    expect(result.isHealthy).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('flags a table with zero rows as unhealthy', async () => {
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createDbSanityRepository();

    const result = await repository.getDbSanity();

    expect(result.isHealthy).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('captures a per-table failure without throwing', async () => {
    mockedGetRowsCount.mockRejectedValue(new Error('boom'));
    const repository = createDbSanityRepository();

    const result = await repository.getDbSanity();

    expect(result.isHealthy).toBe(false);
    expect(result.tableCounts.car_sales).toBeUndefined();
  });
});
