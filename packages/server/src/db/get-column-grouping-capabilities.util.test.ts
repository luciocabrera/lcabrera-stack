import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getColumnGroupingCapabilities } from './get-column-grouping-capabilities.util.ts';
import { getPool } from './get-pool.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const DESCRIPTOR = {
  columns: ['country', 'doc', 'amount'],
  schema: 'public',
  table: 'orders',
} as const;

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('getColumnGroupingCapabilities', () => {
  it('resolves every returned column in a single round trip', async () => {
    query.mockResolvedValue({
      rows: [
        {
          aggregates: ['count', 'max', 'min'],
          column: 'country',
          hasEquality: true,
          hasStats: true,
          nDistinct: 24,
          relTuples: 50_000,
          typeCategory: 'S',
          typeName: 'text',
        },
        {
          aggregates: ['count'],
          column: 'doc',
          hasEquality: true,
          hasStats: true,
          nDistinct: 11,
          relTuples: 50_000,
          typeCategory: 'U',
          typeName: 'jsonb',
        },
        {
          aggregates: ['avg', 'count', 'max', 'min', 'sum'],
          column: 'amount',
          hasEquality: true,
          hasStats: true,
          nDistinct: -1,
          relTuples: 50_000,
          typeCategory: 'N',
          typeName: 'numeric',
        },
      ],
    });

    const capabilities = await getColumnGroupingCapabilities(DESCRIPTOR);

    expect(query).toHaveBeenCalledTimes(1);
    expect(capabilities.country?.canGroup).toBe(true);
    expect(capabilities.doc?.refusal).toBe('not-a-dimension');
    expect(capabilities.amount?.refusal).toBe('unique-ish');
  });

  it('passes schema, table and the column list as bound parameters', async () => {
    query.mockResolvedValue({ rows: [] });

    await getColumnGroupingCapabilities(DESCRIPTOR);

    const [text, values] = query.mock.calls[0] ?? [];

    expect(text).toContain('$1');
    expect(values?.slice(0, 3)).toEqual([
      'public',
      'orders',
      ['country', 'doc', 'amount'],
    ]);
  });

  it('omits a column the table does not have, rather than inventing one', async () => {
    query.mockResolvedValue({ rows: [] });

    expect(await getColumnGroupingCapabilities(DESCRIPTOR)).toEqual({});
  });

  it('resolves on the caller transaction when one is given', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [] });

    await getColumnGroupingCapabilities({
      ...DESCRIPTOR,
      tx: { query: txQuery } as never,
    });

    expect(txQuery).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });
});
