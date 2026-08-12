import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { selectGroupedRows } from './select-grouped-rows.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const CAPABILITY_ROW = {
  aggregates: ['count', 'max', 'min'],
  column: 'country',
  hasEquality: true,
  hasStats: true,
  nDistinct: 24,
  relTuples: 50_000,
  typeCategory: 'S',
  typeName: 'text',
} as const;

const DESCRIPTOR = {
  aggregates: [{ fn: 'count' }],
  allowedColumns: ['country', 'amount'],
  grouping: 'flat',
  keys: ['country'],
  maxRows: 500,
  schema: 'public',
  table: 'orders',
} as const;

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectGroupedRows', () => {
  it('resolves capabilities, then runs the grouped query built from them', async () => {
    const rows = [{ count_rows: '12', country: 'PE', group_mask: 0 }];
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(query).toHaveBeenCalledTimes(2);
    expect(result.rows).toEqual(rows);

    const [groupText] = query.mock.calls[1] ?? [];

    expect(groupText).toContain('GROUP BY GROUPING SETS');
    expect(groupText).toContain('GROUPING("country") AS "group_mask"');
    expect(groupText).toContain('count(*) AS "count_rows"');
  });

  it('returns the decode metadata the rows cannot be read without', async () => {
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(result.aggregates).toEqual([{ alias: 'count_rows', fn: 'count' }]);
    expect(result.keys).toEqual(['country']);
    expect(result.maskAlias).toBe('group_mask');
    expect(result.groupingSetMasks).toEqual([0]);
  });

  it('asks the catalogue only about the keys and aggregate columns', async () => {
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows(DESCRIPTOR);

    const [, capabilityValues] = query.mock.calls[0] ?? [];

    expect(capabilityValues?.slice(0, 3)).toEqual([
      'public',
      'orders',
      ['country'],
    ]);
  });

  it('refuses a key the catalogue will not group, before running the query', async () => {
    query.mockResolvedValueOnce({
      rows: [{ ...CAPABILITY_ROW, hasEquality: false }],
    });

    await expect(selectGroupedRows(DESCRIPTOR)).rejects.toThrow(
      'not a legal group key',
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('refuses a key the catalogue could not see at all', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    await expect(selectGroupedRows(DESCRIPTOR)).rejects.toThrow(
      'No grouping capability was resolved',
    );
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('runs both round trips on the caller transaction when one is given', async () => {
    const txQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows({ ...DESCRIPTOR, tx: { query: txQuery } as never });

    expect(txQuery).toHaveBeenCalledTimes(2);
    expect(query).not.toHaveBeenCalled();
  });
});
