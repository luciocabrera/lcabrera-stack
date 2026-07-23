import { selectFilterOptions } from '@lcabrera/server/db/select-filter-options.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { HttpError } from '../../errors/httpError.js';
import { createDistinctRepository } from './distinct.repository.js';

vi.mock('@lcabrera/server/db/select-filter-options.util', () => ({
  selectFilterOptions: vi.fn(),
}));

const mockedSelectFilterOptions = vi.mocked(selectFilterOptions);

describe('createDistinctRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates the source, then composes selectFilterOptions for the allow-listed column', async () => {
    mockedSelectFilterOptions.mockResolvedValue({
      hasMore: true,
      values: ['Delivered', 'Pending'],
    });
    const repository = createDistinctRepository();

    const result = await repository.getDistinctValues({
      columnName: 'order_status',
      limit: 2,
      offset: 4,
      schemaName: 'public',
      tableName: 'enterprise_orders',
    });

    expect(mockedSelectFilterOptions).toHaveBeenCalledWith({
      allowedColumns: expect.arrayContaining(['order_status']),
      column: 'order_status',
      columnType: 'text',
      limit: 2,
      offset: 4,
      schema: 'public',
      table: 'enterprise_orders',
    });
    expect(result).toEqual({ hasMore: true, values: ['Delivered', 'Pending'] });
  });

  it('rejects a source outside the allow-list before composing the query', async () => {
    const repository = createDistinctRepository();

    await expect(
      repository.getDistinctValues({
        columnName: 'password',
        limit: 50,
        offset: 0,
        schemaName: 'public',
        tableName: 'users',
      }),
    ).rejects.toThrow(HttpError);
    expect(mockedSelectFilterOptions).not.toHaveBeenCalled();
  });
});
