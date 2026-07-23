import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { selectDistinctRows } from './select-distinct-rows.util.ts';

// The pool is the one impure edge; stubbing it keeps this suite DB-free (ADR-032)
// while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectDistinctRows', () => {
  it('runs a SELECT DISTINCT over the descriptor and returns the rows', async () => {
    query.mockResolvedValue({ rows: [{ color: 'Blue' }, { color: 'Red' }] });

    const rows = await selectDistinctRows({
      fields: ['color'],
      schema: 'public',
      table: 'car_sales',
    });

    expect(rows).toEqual([{ color: 'Blue' }, { color: 'Red' }]);
    expect(query).toHaveBeenCalledWith(
      'SELECT DISTINCT "color" FROM "public"."car_sales"',
      [],
    );
  });
});
