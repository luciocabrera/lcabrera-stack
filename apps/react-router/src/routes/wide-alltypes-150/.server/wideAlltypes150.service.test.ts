import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
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
  WIDE_ALLTYPES_ALLOWED_COLUMNS,
  WIDE_ALLTYPES_COLUMNS,
  WIDE_ALLTYPES_GROUP_MAX_ROWS,
  WIDE_ALLTYPES_SCHEMA,
  WIDE_ALLTYPES_TABLE,
} from '../config';
import {
  readWideAlltypes150Page,
  selectWideAlltypes150GroupingCapabilities,
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
vi.mock('@lcabrera/server/db/select-grouped-rows.util', () => ({
  selectGroupedRows: vi.fn(async () => ({
    aggregates: [{ alias: 'count_all', fn: 'count' }],
    keys: ['c_001'],
    maskAlias: 'grouping_mask',
    rows: [{ c_001: 'alpha', count_all: '3', grouping_mask: 0 }],
  })),
}));
vi.mock('@lcabrera/server/db/get-column-grouping-capabilities.util', () => ({
  getColumnGroupingCapabilities: vi.fn(async () => []),
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
  vi.mocked(selectGroupedRows).mockClear();
  vi.mocked(getColumnGroupingCapabilities).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('a truncated group key on this route too', () => {
  it('carries the granularity into the read and back into the decode', async () => {
    // #786 landed on `enterprise-orders` first, and a second route wired to
    // the same helpers is where "the seam is generic" stops being a claim.
    // Without this the route silently groups by raw values and hits the
    // cardinality refusal every date column on this table has.
    await selectWideAlltypes150Page({
      grouping: {
        aggregates: {},
        keys: ['c_001'],
        mode: 'flat',
        periods: { c_001: 'month' },
        shares: [],
      },
      limit: 10,
      offset: 0,
      sorting: [],
    });

    expect(vi.mocked(selectGroupedRows)).toHaveBeenCalledWith(
      expect.objectContaining({ periods: { c_001: 'month' } }),
    );
  });
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

  // #575 — grouping on a *second* SQL-backed route. What is asserted here is
  // the wiring this route owns; the rules themselves belong to
  // `@lcabrera/server` and are tested there, which is the whole claim.
  describe('grouping', () => {
    it('reads the grouped branch when keys are applied, not the paginated one', async () => {
      await selectWideAlltypes150Page({
        grouping: {
          aggregates: {},
          keys: ['c_001'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        limit: 50,
        offset: 0,
        sorting: [],
      });

      expect(vi.mocked(selectGroupedRows)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(selectRows)).not.toHaveBeenCalled();
    });

    it('asks for count(*) first, from the package rather than by hand', async () => {
      await selectWideAlltypes150Page({
        grouping: {
          aggregates: { c_002: 'sum' },
          keys: ['c_001'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        limit: 50,
        offset: 0,
        sorting: [],
      });

      // `toGroupAggregates` owns this order and its decode counterpart reads
      // it back — the route states neither (ADR-082, #643).
      expect(
        vi.mocked(selectGroupedRows).mock.calls[0]?.[0]?.aggregates,
      ).toEqual([{ fn: 'count' }, { column: 'c_002', fn: 'sum' }]);
    });

    it('bounds the grouped read by this table’s own row ceiling', async () => {
      await selectWideAlltypes150Page({
        grouping: {
          aggregates: {},
          keys: ['c_001'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        limit: 50,
        offset: 0,
        sorting: [],
      });

      expect(vi.mocked(selectGroupedRows).mock.calls[0]?.[0]?.maxRows).toBe(
        WIDE_ALLTYPES_GROUP_MAX_ROWS,
      );
    });

    it('orders by the group keys in nesting order, carrying the user’s direction', async () => {
      await selectWideAlltypes150Page({
        grouping: {
          aggregates: {},
          keys: ['c_001', 'c_002'],
          mode: 'rollup',
          periods: {},
          shares: [],
        },
        limit: 50,
        offset: 0,
        sorting: [{ columnKey: 'c_002', direction: 'desc' }],
      });

      expect(vi.mocked(selectGroupedRows).mock.calls[0]?.[0]?.sort).toEqual([
        { direction: 'asc', key: 'c_001' },
        { direction: 'desc', key: 'c_002' },
      ]);
    });

    it('answers a refusal as plain data, never as a thrown class', async () => {
      // A refused key is a refusal from `@lcabrera/server`, raised as a class
      // whose prototype single fetch strips on the way to the client — so the
      // loader edge has to map it (ADR-050, ADR-066). This is the route's half
      // of AC "refused with the specific reason, not by failing at execution".
      vi.mocked(selectGroupedRows).mockRejectedValueOnce(
        new Error('column "c_014" is not a grouping dimension'),
      );

      const result = await selectWideAlltypes150Page({
        grouping: {
          aggregates: {},
          keys: ['c_014'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        limit: 50,
        offset: 0,
        sorting: [],
      });

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });

    it('resolves capability for every column it allows, from the catalogue', async () => {
      // AC: a column whose real type supports aggregates the coarse vocabulary
      // hides must be offered them. The route's job is to ask about all of its
      // columns; deciding what each may do is the catalogue's (ADR-058, #550).
      await selectWideAlltypes150GroupingCapabilities();

      expect(vi.mocked(getColumnGroupingCapabilities)).toHaveBeenCalledWith({
        columns: WIDE_ALLTYPES_ALLOWED_COLUMNS,
        schema: WIDE_ALLTYPES_SCHEMA,
        table: WIDE_ALLTYPES_TABLE,
      });
    });
  });
});
