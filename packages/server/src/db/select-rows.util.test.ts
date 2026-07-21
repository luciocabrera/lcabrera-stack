import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from './get-pool.util.ts';
import { selectRows } from './select-rows.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('selectRows', () => {
  it('executes the descriptor as SQL on the pool and returns the driver rows', async () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    query.mockResolvedValue({ rows });

    const result = await selectRows<{ readonly id: string }>({
      fields: ['id'],
      schema: 'llm_usage',
      sort: [{ column: 'id', direction: 'asc' }],
      table: 'v_daily_llm_cost',
    });

    expect(result).toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      'SELECT "id" FROM "llm_usage"."v_daily_llm_cost" ORDER BY "id" ASC',
      [],
    );
  });

  it('forwards filter values as bound parameters rather than inlining them', async () => {
    query.mockResolvedValue({ rows: [] });

    await selectRows({
      fields: ['id'],
      filters: [{ column: 'scan_id', operator: 'eq', value: 'abc' }],
      schema: 'llm_usage',
      table: 'v_daily_llm_cost',
    });

    expect(query).toHaveBeenCalledWith(
      'SELECT "id" FROM "llm_usage"."v_daily_llm_cost" WHERE "scan_id" = $1',
      ['abc'],
    );
  });

  it('propagates the builder rejection without touching the pool', async () => {
    await expect(
      selectRows({
        fields: ['id'],
        schema: 'llm_usage',
        table: 'v; DROP TABLE',
      }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });
});
