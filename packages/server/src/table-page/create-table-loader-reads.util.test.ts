import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TablePageReader } from './create-table-page-reader.util.ts';

import { createTableLoaderReads } from './create-table-loader-reads.util.ts';

type Reader = TablePageReader<{ readonly id: number }>;

const selectPage = vi.fn<Reader['selectPage']>(async () => ({
  data: [],
  hasMore: false,
  total: 0,
}));

const selectGroupingCapabilities = vi.fn<Reader['selectGroupingCapabilities']>(
  async () => ({}),
);

const reads = createTableLoaderReads({
  limit: 50,
  reader: { selectGroupingCapabilities, selectPage },
});

const GROUPING = {
  aggregates: [{ columnKey: 'amount', fn: 'sum' }],
  keys: ['status'],
  mode: 'flat',
  periods: {},
} as const;

beforeEach(() => {
  selectPage.mockClear();
  selectGroupingCapabilities.mockClear();
});

describe('fetchPage', () => {
  it('reads the first page in the order and under the filters the view states', async () => {
    await reads.fetchPage({
      effectiveSorting: [
        { columnKey: 'amount', direction: 'desc' },
        { columnKey: 'id', direction: 'asc' },
      ],
      filters: { active: { type: 'boolean', value: true } },
    });

    expect(selectPage).toHaveBeenCalledWith({
      filters: [{ column: 'active', operator: 'eq', value: true }],
      includeTotal: true,
      limit: 50,
      offset: 0,
      sort: [
        { column: 'amount', direction: 'desc' },
        { column: 'id', direction: 'asc' },
      ],
    });
  });

  it('drops a sort rule that names no direction rather than sorting on it', async () => {
    await reads.fetchPage({
      effectiveSorting: [
        { columnKey: 'amount' },
        { columnKey: 'id', direction: 'asc' },
      ],
      filters: {},
    });

    expect(selectPage.mock.calls[0]?.[0].sort).toEqual([
      { column: 'id', direction: 'asc' },
    ]);
  });

  it('passes the grouping and where its totals go to the read', async () => {
    await reads.fetchPage({
      effectiveSorting: [],
      filters: {},
      grouping: GROUPING,
      totalsPlacement: 'first',
    });

    expect(selectPage.mock.calls[0]?.[0]).toMatchObject({
      grouping: GROUPING,
      totalsPlacement: 'first',
    });
  });

  it('answers with the page the read returned', async () => {
    const page = { data: [{ id: 7 }], hasMore: true, total: 9 };

    selectPage.mockResolvedValueOnce(page);

    await expect(
      reads.fetchPage({ effectiveSorting: [], filters: {} }),
    ).resolves.toBe(page);
  });
});

describe('resolveGroupingCapabilities', () => {
  it('asks the reader for the table it is bound to', async () => {
    await reads.resolveGroupingCapabilities();

    expect(selectGroupingCapabilities).toHaveBeenCalledOnce();
  });
});
