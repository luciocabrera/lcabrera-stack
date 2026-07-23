import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createWideAlltypes150Repository } from './wideAlltypes150.repository.js';

vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(),
}));
vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(),
}));

const mockedSelectRows = vi.mocked(selectRows);
const mockedGetRowsCount = vi.mocked(getRowsCount);

describe('createWideAlltypes150Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads every column, counts by id, and reports the page', async () => {
    mockedSelectRows.mockResolvedValue([{ c_001: 'a', id: 1 }]);
    mockedGetRowsCount.mockResolvedValue(1);
    const repository = createWideAlltypes150Repository();

    const result = await repository.getPaginated({
      limit: 1,
      skip: 0,
      sorting: [{ columnKey: 'c_001', direction: 'asc' }],
    });

    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.arrayContaining(['id', 'c_001', 'c_149']),
        limit: 1,
        offset: 0,
        schema: 'public',
        sort: [{ column: 'c_001', direction: 'asc' }],
        table: 'wide_alltypes_150',
      }),
    );
    expect(mockedGetRowsCount).toHaveBeenCalledWith({
      column: 'id',
      schema: 'public',
      table: 'wide_alltypes_150',
    });
    expect(result).toEqual({
      data: [{ c_001: 'a', id: 1 }],
      hasMore: false,
      total: 1,
    });
  });

  it('drops an unsortable column (c_018) and falls back to the default sort', async () => {
    mockedSelectRows.mockResolvedValue([]);
    mockedGetRowsCount.mockResolvedValue(0);
    const repository = createWideAlltypes150Repository();

    await repository.getPaginated({
      limit: 10,
      skip: 0,
      sorting: [{ columnKey: 'c_018', direction: 'asc' }],
    });

    expect(mockedSelectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: [{ column: 'id', direction: 'asc' }],
      }),
    );
  });
});
