import type { Pool, PoolClient } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GroupingRefusedError } from '../errors/grouping-refused.error.ts';
import { getPool } from './get-pool.util.ts';
import { selectColumnAxisValues } from './select-column-axis-values.util.ts';

vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

const ARGS = {
  allowedColumns: ['year', 'region'],
  filters: [{ column: 'region', operator: 'eq', value: 'PE' }],
  key: 'year',
  maxDistinct: 2,
  schema: 'public',
  table: 'orders',
} as const;

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectColumnAxisValues', () => {
  it('selects distinct axis values under the caller ceiling, keeping empty ones', async () => {
    query.mockResolvedValueOnce({
      rows: [{ year: 2022 }, {}],
    });

    const values = await selectColumnAxisValues({
      ...ARGS,
      tx: { query } as unknown as PoolClient,
    });

    expect(values).toEqual([2022, undefined]);
    expect(String(query.mock.calls[0]?.[0])).toContain('SELECT DISTINCT');
    expect(String(query.mock.calls[0]?.[0])).toContain('LIMIT');
    expect(query.mock.calls[0]?.[1]).toEqual(['PE', 3]);
  });

  it('refuses when the extra row past the ceiling arrives', async () => {
    query.mockResolvedValueOnce({
      rows: [{ year: 2021 }, { year: 2022 }, { year: 2023 }],
    });

    try {
      await selectColumnAxisValues({
        ...ARGS,
        tx: { query } as unknown as PoolClient,
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GroupingRefusedError);
      expect((error as GroupingRefusedError).reason).toBe(
        'column-axis-too-wide',
      );
      expect((error as GroupingRefusedError).column).toBe('year');
    }
  });
});
