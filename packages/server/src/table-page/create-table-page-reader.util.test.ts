import {
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test';

import { deleteRows } from '../db/delete-rows.util.ts';
import { getColumnGroupingCapabilities } from '../db/get-column-grouping-capabilities.util.ts';
import { getRowsCount } from '../db/get-rows-count.util.ts';
import { selectGroupedRows } from '../db/select-grouped-rows.util.ts';
import { selectRows } from '../db/select-rows.util.ts';
import { GroupingRefusedError } from '../errors/grouping-refused.error.ts';
import { createTablePageReader } from './create-table-page-reader.util.ts';

vi.mock('../db/delete-rows.util.ts', () => ({
  deleteRows: vi.fn(async () => []),
}));
vi.mock('../db/get-column-grouping-capabilities.util.ts', () => ({
  getColumnGroupingCapabilities: vi.fn(async () => ({})),
}));
vi.mock('../db/get-rows-count.util.ts', () => ({
  getRowsCount: vi.fn(async () => 42),
}));
vi.mock('../db/select-rows.util.ts', () => ({
  selectRows: vi.fn(async () => [{ id: 7 }]),
}));
vi.mock('../db/select-grouped-rows.util.ts', () => ({
  selectGroupedRows: vi.fn(async () => ({
    aggregates: [{ alias: 'count_rows', fn: 'count' }],
    groupingSetMasks: [0],
    keys: ['status'],
    maskAlias: 'group_mask',
    rows: JSON.parse(
      '[{"count_rows":"12","group_mask":0,"status":"open"},{"count_rows":"3","group_mask":0,"status":null}]',
    ) as readonly Record<string, unknown>[],
    truncations: {},
  })),
}));

const TARGET = {
  allowedColumns: ['created_on', 'id', 'name', 'status', 'total'],
  schema: 'public',
  table: 'items',
} as const;

const MAX_LIMIT = 100;
const GROUP_MAX_ROWS = 500;

const reader = createTablePageReader<{ readonly id: number }, 'id'>({
  defaultLimit: 50,
  fallbackSort: [{ columnKey: 'id', direction: 'asc' }],
  fields: ['id', 'name'],
  groupMaxRows: GROUP_MAX_ROWS,
  ignoredSortColumns: ['menu'],
  maxLimit: MAX_LIMIT,
  primaryKey: 'id',
  target: TARGET,
});

const readArgs = {
  filters: [],
  includeTotal: true,
  limit: 10,
  offset: 0,
  sort: [],
} as const;

const grouping = (keys: readonly string[]) => ({
  aggregates: [],
  keys,
  mode: 'flat' as const,
  periods: {},
});

const firstSelect = () => vi.mocked(selectRows).mock.calls[0]?.[0];
const firstGroupedSelect = () =>
  vi.mocked(selectGroupedRows).mock.calls[0]?.[0];

beforeEach(() => {
  vi.mocked(selectRows).mockClear();
  vi.mocked(getRowsCount).mockClear();
  vi.mocked(selectGroupedRows).mockClear();
  vi.mocked(getColumnGroupingCapabilities).mockClear();
});

describe('selectPage — rows', () => {
  it('returns a page with total and hasMore from the count query', async () => {
    const page = await reader.selectPage(readArgs);

    expect(page).toStrictEqual({ data: [{ id: 7 }], hasMore: true, total: 42 });
    expect(getRowsCount).toHaveBeenCalledWith({
      ...TARGET,
      column: 'id',
      filters: [],
    });
  });

  it('projects the declared fields, and every allowed column by default', async () => {
    await reader.selectPage(readArgs);

    expect(firstSelect()?.fields).toStrictEqual(['id', 'name']);

    vi.mocked(selectRows).mockClear();

    await createTablePageReader({
      defaultLimit: 50,
      fallbackSort: [{ columnKey: 'id', direction: 'asc' }],
      groupMaxRows: GROUP_MAX_ROWS,
      maxLimit: MAX_LIMIT,
      primaryKey: 'id',
      target: TARGET,
    }).selectPage(readArgs);

    expect(firstSelect()?.fields).toStrictEqual(TARGET.allowedColumns);
  });

  it('skips the count on a load-more page and reports no total', async () => {
    const page = await reader.selectPage({
      ...readArgs,
      includeTotal: false,
      offset: 50,
    });

    expect(getRowsCount).not.toHaveBeenCalled();
    expect(page.total).toBeUndefined();
    expect(page.hasMore).toBe(false);
  });

  it('reports more rows when a page without a total comes back full', async () => {
    const page = await reader.selectPage({
      ...readArgs,
      includeTotal: false,
      limit: 1,
    });

    expect(page.hasMore).toBe(true);
  });

  it('clamps a window above the ceiling and raises a zero window to one row', async () => {
    await reader.selectPage({ ...readArgs, limit: 999_999_999 });
    await reader.selectPage({ ...readArgs, limit: 0 });

    expect(firstSelect()?.limit).toBe(MAX_LIMIT);
    expect(vi.mocked(selectRows).mock.calls[1]?.[0]?.limit).toBe(1);
  });

  it('truncates a sort longer than the allowed columns by default', async () => {
    await reader.selectPage({
      ...readArgs,
      sort: Array.from(
        { length: TARGET.allowedColumns.length + 3 },
        () => ({ column: 'id', direction: 'asc' }) as const,
      ),
    });

    expect(firstSelect()?.sort).toHaveLength(TARGET.allowedColumns.length);
  });

  it('truncates a sort to a declared rule ceiling', async () => {
    await createTablePageReader({
      defaultLimit: 50,
      fallbackSort: [{ columnKey: 'id', direction: 'asc' }],
      groupMaxRows: GROUP_MAX_ROWS,
      maxLimit: MAX_LIMIT,
      maxSortRules: 2,
      primaryKey: 'id',
      target: TARGET,
    }).selectPage({
      ...readArgs,
      sort: [
        { column: 'name', direction: 'asc' },
        { column: 'status', direction: 'asc' },
        { column: 'id', direction: 'asc' },
      ],
    });

    expect(firstSelect()?.sort).toStrictEqual([
      { column: 'name', direction: 'asc' },
      { column: 'status', direction: 'asc' },
    ]);
  });

  it('seeks past a keyset cursor instead of applying an offset', async () => {
    await reader.selectPage({
      ...readArgs,
      cursor: [4821],
      offset: 50,
      sort: [{ column: 'id', direction: 'asc' }],
    });

    expect(firstSelect()?.cursor).toStrictEqual({
      uniqueColumn: 'id',
      values: [4821],
    });
    expect(firstSelect()?.offset).toBeUndefined();
  });

  it('falls back to the offset when the sort is not a total order', async () => {
    await reader.selectPage({
      ...readArgs,
      cursor: [4821, 'Acme'],
      offset: 50,
      sort: [
        { column: 'id', direction: 'asc' },
        { column: 'name', direction: 'asc' },
      ],
    });

    expect(firstSelect()?.cursor).toBeUndefined();
    expect(firstSelect()?.offset).toBe(50);
  });

  it('runs the row read when the grouping names no key', async () => {
    await reader.selectPage({ ...readArgs, grouping: grouping([]) });

    expect(selectRows).toHaveBeenCalledTimes(1);
    expect(selectGroupedRows).not.toHaveBeenCalled();
  });
});

describe('selectPage — groups', () => {
  it('runs the grouped read when the grouping names a key', async () => {
    const page = await reader.selectPage({
      ...readArgs,
      filters: [{ column: 'name', operator: 'eq', value: 'A' }],
      grouping: grouping(['status']),
      limit: 1,
    });

    expect(selectRows).not.toHaveBeenCalled();
    expect(firstGroupedSelect()).toMatchObject({
      aggregates: [{ fn: 'count' }],
      allowedColumns: TARGET.allowedColumns,
      filters: [{ column: 'name', operator: 'eq', value: 'A' }],
      grouping: 'flat',
      keys: ['status'],
      maxRows: GROUP_MAX_ROWS,
      schema: 'public',
      sort: [{ direction: 'asc', key: 'status' }],
      subtotalPlacement: 'last',
      table: 'items',
    });
    expect(firstGroupedSelect()?.columnAxis).toBeUndefined();
    expect(page.hasMore).toBe(false);
    expect(page.total).toBe(2);
    expect(page.data).toHaveLength(2);
  });

  it('carries the aggregates, the totals placement and the bounded sort', async () => {
    await reader.selectPage({
      ...readArgs,
      grouping: {
        ...grouping(['status']),
        aggregates: [{ columnKey: 'total', fn: 'sum' }],
      },
      sort: [
        { column: 'status', direction: 'desc' },
        { column: 'total:sum', direction: 'asc' },
      ],
      totalsPlacement: 'first',
    });

    expect(firstGroupedSelect()).toMatchObject({
      aggregates: [{ fn: 'count' }, { column: 'total', fn: 'sum' }],
      sort: [
        { direction: 'desc', key: 'status' },
        { aggregateAlias: expect.any(String), direction: 'asc' },
      ],
      subtotalPlacement: 'first',
    });
  });

  it('passes a column axis with the process ceiling', async () => {
    vi.mocked(selectGroupedRows).mockResolvedValueOnce({
      aggregates: [{ alias: 'count_rows', fn: 'count' }],
      columnAxis: { key: 'name', values: ['a'] },
      estimate: { kind: 'known', rows: 1 },
      groupingSetMasks: [0],
      keys: ['status'],
      maskAlias: 'group_mask',
      rows: [{ count_rows: '1', group_mask: 0, status: 'open' }],
      truncations: {},
    });

    const page = await reader.selectPage({
      ...readArgs,
      grouping: { ...grouping(['status']), columnAxis: 'name' },
    });

    expect(firstGroupedSelect()?.columnAxis).toStrictEqual({
      key: 'name',
      maxDistinct: expect.any(Number),
    });
    expect(page.data).toHaveLength(1);
  });

  it('carries a grouping warning beside the rows', async () => {
    vi.mocked(selectGroupedRows).mockResolvedValueOnce({
      aggregates: [{ alias: 'count_rows', fn: 'count' }],
      estimate: { columns: ['status'], kind: 'unknown' },
      groupingSetMasks: [0],
      keys: ['status'],
      maskAlias: 'group_mask',
      rows: [{ count_rows: '12', group_mask: 0, status: 'open' }],
      truncations: {},
      warning: { columns: ['status'], kind: 'stats-unavailable' },
    });

    const page = await reader.selectPage({
      ...readArgs,
      grouping: grouping(['status']),
    });

    expect(page.groupingWarning).toStrictEqual({
      columns: ['status'],
      kind: 'stats-unavailable',
    });
    expect(page.error).toBeUndefined();
  });

  it('maps a refusal to a plain, serializable error', async () => {
    vi.mocked(selectGroupedRows).mockRejectedValueOnce(
      new GroupingRefusedError({
        message: 'too deep',
        reason: 'too-many-keys',
      }),
    );

    const page = await reader.selectPage({
      ...readArgs,
      grouping: grouping(['status']),
    });

    expect(page).toStrictEqual({
      data: [],
      error: {
        kind: 'grouping-refused',
        message: 'too deep',
        reason: 'too-many-keys',
      },
      hasMore: false,
      total: 0,
    });
    expect(structuredClone(page)).toStrictEqual(page);
  });
});

describe('grouping metadata', () => {
  it('reads the capabilities of every allowed column', async () => {
    await reader.selectGroupingCapabilities();

    expect(getColumnGroupingCapabilities).toHaveBeenCalledWith({
      columns: TARGET.allowedColumns,
      schema: 'public',
      table: 'items',
    });
  });

  it('reads no capability when no key is truncated to a period', async () => {
    expect(await reader.selectGroupKeyTruncations(undefined)).toStrictEqual({});
    expect(await reader.selectGroupKeyTruncations({})).toStrictEqual({});
    expect(getColumnGroupingCapabilities).not.toHaveBeenCalled();
  });

  it('reads the capabilities of the truncated keys only', async () => {
    await reader.selectGroupKeyTruncations({ created_on: 'month' });

    expect(getColumnGroupingCapabilities).toHaveBeenCalledWith({
      columns: ['created_on'],
      schema: 'public',
      table: 'items',
    });
  });
});

const GROUP_TOKEN = JSON.stringify({
  isSubtotal: false,
  keys: ['status'],
  path: [{ columnKey: 'status', value: 'open' }],
});

const paramsFor = (entries: Record<string, string>) =>
  new URLSearchParams({ limit: '25', skip: '0', ...entries });

describe('resolvePageRead', () => {
  it('scopes the read to a group named in the params', async () => {
    const resolved = await reader.resolvePageRead(
      paramsFor({ group: GROUP_TOKEN }),
    );

    expect(resolved.kind === 'read' && resolved.read.filters).toStrictEqual([
      { column: 'status', operator: 'eq', value: 'open' },
    ]);
  });

  it('reads the whole table when no group is named', async () => {
    const resolved = await reader.resolvePageRead(paramsFor({ skip: '50' }));

    expect(resolved.kind === 'read' && resolved.read).toMatchObject({
      includeTotal: false,
      limit: 25,
      offset: 50,
      sort: [{ column: 'id', direction: 'asc' }],
    });
  });

  it('drops an ignored sort column before it reaches the read', async () => {
    const resolved = await reader.resolvePageRead(
      paramsFor({
        sort: JSON.stringify([
          { columnKey: 'menu', direction: 'asc' },
          { columnKey: 'name', direction: 'desc' },
        ]),
      }),
    );

    expect(resolved.kind === 'read' && resolved.read.sort).toStrictEqual([
      { column: 'name', direction: 'desc' },
    ]);
  });

  it('clamps a group page to the ceiling and breaks ties on the primary key', async () => {
    const resolved = await reader.resolvePageRead(
      paramsFor({ group: GROUP_TOKEN, limit: String(MAX_LIMIT + 1) }),
    );

    expect(resolved.kind === 'read' && resolved.read.limit).toBe(MAX_LIMIT);
    expect(resolved.kind === 'read' && resolved.read.sort.at(-1)).toEqual({
      column: 'id',
      direction: 'asc',
    });
  });

  it('refuses an unreadable group token instead of reading the whole table', async () => {
    const resolved = await reader.resolvePageRead(
      paramsFor({ group: 'not json' }),
    );

    expect(resolved.kind).toBe('refused');
  });

  it('reads the truncations of a period-grouped token', async () => {
    await reader.resolvePageRead(
      paramsFor({
        group: JSON.stringify({
          isSubtotal: false,
          keys: ['created_on'],
          path: [{ columnKey: 'created_on', value: '2026-01-01' }],
          periods: { created_on: 'month' },
        }),
      }),
    );

    expect(getColumnGroupingCapabilities).toHaveBeenCalledWith(
      expect.objectContaining({ columns: ['created_on'] }),
    );
  });
});

describe('resolveGroupRestriction', () => {
  it('states the group a request names, labelled from the columns', async () => {
    const statement = await reader.resolveGroupRestriction({
      columns: [{ key: 'status', label: 'Status' }],
      params: new URLSearchParams({ group: GROUP_TOKEN }),
    });

    expect(statement).toStrictEqual({
      entries: [{ columnKey: 'status', label: 'Status', value: 'open' }],
    });
  });
});

describe('deleteRow', () => {
  it('takes the primary key column’s type, and nothing else', () => {
    expectTypeOf(reader.deleteRow).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(reader.deleteRow).parameter(0).not.toEqualTypeOf<string>();
  });

  it('deletes by primary key', async () => {
    await reader.deleteRow(7);

    expect(deleteRows).toHaveBeenCalledWith({
      ...TARGET,
      filters: [{ column: 'id', operator: 'eq', value: 7 }],
    });
  });
});
