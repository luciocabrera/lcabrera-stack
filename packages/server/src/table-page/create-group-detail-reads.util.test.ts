import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TablePageReader } from './create-table-page-reader.util.ts';

import { createGroupDetailReads } from './create-group-detail-reads.util.ts';

type Reader = TablePageReader<{ readonly id: number }>;

const resolveGroupRead = vi.fn<Reader['resolveGroupRead']>();
const resolveGroupRestriction = vi.fn<Reader['resolveGroupRestriction']>(
  async () => ({ entries: [] }),
);
const selectPage = vi.fn<Reader['selectPage']>(async () => ({
  data: [],
  hasMore: false,
  total: 0,
}));

const COLUMNS = [{ key: 'status', label: 'Status' }];

const reads = createGroupDetailReads({
  columns: COLUMNS,
  limit: 50,
  reader: { resolveGroupRead, resolveGroupRestriction, selectPage },
});

const request = new Request('http://localhost/items/group?group=token');

beforeEach(() => {
  resolveGroupRead.mockReset();
  resolveGroupRestriction.mockClear();
  selectPage.mockClear();
});

describe('fetchPage', () => {
  it('requires a group and reads its first page with the view’s filters and sort', async () => {
    const read = {
      filters: [],
      includeTotal: true,
      limit: 50,
      offset: 0,
      sort: [],
    } as const;

    resolveGroupRead.mockResolvedValueOnce({ kind: 'read', read });

    await reads.fetchPage({
      effectiveSorting: [
        { columnKey: 'name', direction: 'desc' },
        { columnKey: 'status' },
      ],
      filters: { active: { type: 'boolean', value: true } },
      request,
    });

    const [args] = resolveGroupRead.mock.calls[0] ?? [];

    expect(args).toMatchObject({
      filters: [{ column: 'active', operator: 'eq', value: true }],
      isGroupRequired: true,
      limit: 50,
      skip: 0,
      sort: [{ column: 'name', direction: 'desc' }],
    });
    expect(args?.params.get('group')).toBe('token');
    expect(selectPage).toHaveBeenCalledWith(read);
  });

  it('answers a refused group with an empty page carrying the refusal', async () => {
    resolveGroupRead.mockResolvedValueOnce({
      kind: 'refused',
      message: 'A subtotal has no rows of its own.',
      reason: 'subtotal',
    });

    const page = await reads.fetchPage({
      effectiveSorting: [],
      filters: {},
      request,
    });

    expect(page).toStrictEqual({
      data: [],
      error: {
        kind: 'unexpected',
        message: 'A subtotal has no rows of its own.',
      },
      hasMore: false,
      total: 0,
    });
    expect(selectPage).not.toHaveBeenCalled();
  });
});

describe('resolveLockedFilters', () => {
  it('states the group the request names, against the declared columns', async () => {
    await reads.resolveLockedFilters({ request });

    const [args] = resolveGroupRestriction.mock.calls[0] ?? [];

    expect(args?.columns).toBe(COLUMNS);
    expect(args?.isGroupRequired).toBe(true);
    expect(args?.params.get('group')).toBe('token');
  });
});
