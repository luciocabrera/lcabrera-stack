import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { fetchWideAlltypes150Page } from '@/services';

import {
  MAX_WIDE_ALLTYPES_SORT_RULES,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_SCHEMA,
  WIDE_ALLTYPES_TABLE,
} from '../config';
import {
  readWideAlltypes150Page,
  selectWideAlltypes150Page,
} from './wideAlltypes150.service';

vi.mock('@lcabrera/server/db/get-rows-count.util', () => ({
  getRowsCount: vi.fn(async () => 1_000_000),
}));
vi.mock('@lcabrera/server/db/select-rows.util', () => ({
  selectRows: vi.fn(async () => [
    {
      c_009: new Date('2020-01-01T23:00:00.000Z'),
      c_014: { g: 1 },
      c_015: new Uint8Array([0x3a, 0xb7]),
      c_019: [1, 19],
      id: '1',
    },
  ]),
}));
vi.mock('@/services', () => ({
  fetchWideAlltypes150Page: vi.fn(async () => ({
    data: [],
    hasMore: false,
    total: 0,
  })),
}));

const requestedSort = () => vi.mocked(selectRows).mock.calls.at(0)?.at(0)?.sort;

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
  vi.mocked(fetchWideAlltypes150Page).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('selectWideAlltypes150Page', () => {
  it('reads all 150 columns from public.wide_alltypes_150, bounded by the window', async () => {
    await selectWideAlltypes150Page({ limit: 50, offset: 100, sorting: [] });

    expect(selectRows).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedColumns: WIDE_ALLTYPES_COLUMNS,
        fields: WIDE_ALLTYPES_COLUMNS,
        limit: 50,
        offset: 100,
        schema: WIDE_ALLTYPES_SCHEMA,
        table: WIDE_ALLTYPES_TABLE,
      }),
    );
  });

  it('drops the point column from the sort rather than letting it fail the query', async () => {
    // `point` has no btree ordering, so Postgres rejects the whole read — not
    // just that term — if it reaches the ORDER BY.
    await selectWideAlltypes150Page({
      limit: 10,
      offset: 0,
      sorting: [
        { columnKey: 'c_018', direction: 'asc' },
        { columnKey: 'c_002', direction: 'desc' },
      ],
    });

    expect(requestedSort()).toStrictEqual([
      { column: 'c_002', direction: 'desc' },
    ]);
  });

  it('caps the sort at MAX_WIDE_ALLTYPES_SORT_RULES terms', async () => {
    await selectWideAlltypes150Page({
      limit: 10,
      offset: 0,
      sorting: WIDE_ALLTYPES_COLUMNS.slice(1, 12).map((columnKey) => ({
        columnKey,
        direction: 'asc' as const,
      })),
    });

    expect(requestedSort()).toHaveLength(MAX_WIDE_ALLTYPES_SORT_RULES);
  });

  it('orders by the primary key when nothing usable is left', async () => {
    await selectWideAlltypes150Page({
      limit: 10,
      offset: 0,
      sorting: [{ columnKey: 'c_018', direction: 'asc' }],
    });

    expect(requestedSort()).toStrictEqual([{ column: 'id', direction: 'asc' }]);
  });

  it('counts the primary key on every page, not only the first', async () => {
    await selectWideAlltypes150Page({ limit: 10, offset: 9990, sorting: [] });

    expect(getRowsCount).toHaveBeenCalledWith(
      expect.objectContaining({ column: 'id', table: WIDE_ALLTYPES_TABLE }),
    );
  });

  it('answers `{ data, hasMore, total }` with every value already JSON-rendered', async () => {
    const page = await selectWideAlltypes150Page({
      limit: 10,
      offset: 0,
      sorting: [],
    });

    expect(
      Object.keys(page).toSorted((a, b) => a.localeCompare(b)),
    ).toStrictEqual(['data', 'hasMore', 'total']);
    expect(page.total).toBe(1_000_000);
    expect(page.data.at(0)).toStrictEqual({
      c_009: '"2020-01-01T23:00:00.000Z"',
      c_014: '{"g":1}',
      c_015: '3ab7',
      c_019: [1, 19],
      id: '1',
    });
  });

  it('reports the end of the set when the window reaches the total', async () => {
    vi.mocked(getRowsCount).mockResolvedValueOnce(1);

    const page = await selectWideAlltypes150Page({
      limit: 10,
      offset: 0,
      sorting: [],
    });

    expect(page.hasMore).toBe(false);
  });
});

describe('readWideAlltypes150Page', () => {
  it('reads Postgres when no external API is configured', async () => {
    vi.stubEnv('VITE_API_URL', undefined);

    await readWideAlltypes150Page({
      limit: 50,
      requestUrl: 'http://localhost:5173/wide-alltypes-150',
      skip: 0,
      sorting: [{ columnKey: 'c_002', direction: 'desc' }],
    });

    expect(selectRows).toHaveBeenCalledTimes(1);
    expect(fetchWideAlltypes150Page).not.toHaveBeenCalled();
  });

  it('fetches the external API when VITE_API_URL is set, and never touches the pool', async () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api');

    await readWideAlltypes150Page({
      limit: 50,
      requestUrl: 'http://localhost:5173/wide-alltypes-150',
      skip: 50,
      sorting: [],
    });

    expect(fetchWideAlltypes150Page).toHaveBeenCalledWith({
      limit: 50,
      requestUrl: 'http://localhost:5173/wide-alltypes-150',
      skip: 50,
      sorting: [],
    });
    expect(selectRows).not.toHaveBeenCalled();
  });
});
