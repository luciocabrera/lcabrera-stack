import type { Pool, PoolClient } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { selectGroupedRows } from './select-grouped-rows.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();
const release = vi.fn();
const connect = vi.fn();

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

/** Every statement the borrowed connection saw, in order. */
const statements = () => query.mock.calls.map(([text]) => String(text));

/** The BEGIN + `set_config` preamble every grouped read now issues. */
const resolvePreamble = () => {
  query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ set_config: '10000' }] });
};

beforeEach(() => {
  query.mockReset();
  release.mockReset();
  connect.mockReset();
  connect.mockResolvedValue({ query, release } as unknown as PoolClient);
  vi.mocked(getPool).mockReturnValue({ connect, query } as unknown as Pool);
});

describe('selectGroupedRows', () => {
  it('resolves capabilities, then runs the grouped query built from them', async () => {
    const rows = [{ count_rows: '12', country: 'PE', group_mask: 0 }];
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows })
      .mockResolvedValueOnce({ rows: [] });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(result.rows).toEqual(rows);

    const groupText = statements()[3];

    expect(groupText).toContain('GROUP BY GROUPING SETS');
    expect(groupText).toContain('GROUPING("country") AS "group_mask"');
    expect(groupText).toContain('count(*) AS "count_rows"');
  });

  it('opens a transaction and scopes a statement timeout to it before anything else', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows(DESCRIPTOR);

    const [begin, timeout] = statements();

    expect(begin).toBe('BEGIN');
    // `is_local = true` is the whole point: without it the setting outlives the
    // transaction and re-tunes every later query on this pooled connection.
    expect(timeout).toBe(`SELECT set_config('statement_timeout', $1, true)`);
    expect(statements().at(-1)).toBe('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('runs both round trips on the transaction the timeout applies to', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows(DESCRIPTOR);

    // An executor called without `tx` would use the pool singleton instead —
    // outside the transaction, unbounded, and with no symptom, because the
    // query still succeeds.
    expect(statements()).toEqual([
      'BEGIN',
      expect.stringContaining('set_config'),
      expect.stringContaining('pg_stats'),
      expect.stringContaining('GROUP BY GROUPING SETS'),
      'COMMIT',
    ]);
  });

  it('returns the decode metadata the rows cannot be read without', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(result.aggregates).toEqual([{ alias: 'count_rows', fn: 'count' }]);
    expect(result.keys).toEqual(['country']);
    expect(result.maskAlias).toBe('group_mask');
    expect(result.groupingSetMasks).toEqual([0]);
  });

  it('reports the pre-flight estimate beside the rows', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(result.estimate).toEqual({ kind: 'known', rows: 24 });
    expect(result.warning).toBeUndefined();
  });

  it('warns and proceeds when the table has no statistics', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [{ ...CAPABILITY_ROW, hasStats: false }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await selectGroupedRows(DESCRIPTOR);

    expect(result.warning).toEqual({
      columns: ['country'],
      kind: 'stats-unavailable',
    });
    expect(result.estimate).toEqual({ columns: ['country'], kind: 'unknown' });
  });

  it('refuses a result that reached the backstop rather than truncating it', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [{ ...CAPABILITY_ROW, hasStats: false }] })
      .mockResolvedValueOnce({ rows: Array.from({ length: 5001 }, () => ({})) })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      selectGroupedRows({ ...DESCRIPTOR, maxRows: 20_000 }),
    ).rejects.toThrow('past the ceiling');

    // The backstop is what the guard capped the read at, not what the caller
    // asked for.
    expect(statements()[3]).toContain('LIMIT $1');
    expect(query.mock.calls[3]?.[1]).toEqual([5001]);
  });

  it('asks the catalogue only about the keys and aggregate columns', async () => {
    resolvePreamble();
    query
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows(DESCRIPTOR);

    const [, capabilityValues] = query.mock.calls[2] ?? [];

    expect(capabilityValues?.slice(0, 3)).toEqual([
      'public',
      'orders',
      ['country'],
    ]);
  });

  it('checks depth before borrowing a connection at all', async () => {
    // The reason the depth check is pure and runs first: a request past the cap
    // must not cost a pooled connection, a BEGIN, or a catalogue query.
    await expect(
      selectGroupedRows({ ...DESCRIPTOR, keys: ['a', 'b', 'c', 'd', 'e'] }),
    ).rejects.toThrow('at most 4 group keys');

    expect(connect).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('refuses a key the catalogue will not group, before running the query', async () => {
    resolvePreamble();
    query.mockResolvedValueOnce({
      rows: [{ ...CAPABILITY_ROW, hasEquality: false }],
    });

    await expect(selectGroupedRows(DESCRIPTOR)).rejects.toThrow(
      'not a legal group key',
    );
    expect(
      statements().some((text) => text.includes('GROUP BY GROUPING SETS')),
    ).toBe(false);
  });

  it('refuses a key the catalogue could not see at all', async () => {
    resolvePreamble();
    query.mockResolvedValueOnce({ rows: [] });

    await expect(selectGroupedRows(DESCRIPTOR)).rejects.toThrow(
      'No grouping capability was resolved',
    );
  });

  it('runs on the caller transaction when one is given, opening none of its own', async () => {
    const txQuery = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ set_config: '10000' }] })
      .mockResolvedValueOnce({ rows: [CAPABILITY_ROW] })
      .mockResolvedValueOnce({ rows: [] });

    await selectGroupedRows({ ...DESCRIPTOR, tx: { query: txQuery } as never });

    // The timeout still applies: the caller's transaction is already a
    // transaction, so `is_local` scopes the setting to it exactly the same way.
    expect(txQuery.mock.calls.map(([text]) => String(text))).toEqual([
      expect.stringContaining('set_config'),
      expect.stringContaining('pg_stats'),
      expect.stringContaining('GROUP BY GROUPING SETS'),
    ]);
    expect(connect).not.toHaveBeenCalled();
  });
});
