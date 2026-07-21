import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteRows } from './delete-rows.util.ts';
import { getPool } from './get-pool.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('deleteRows', () => {
  it('executes a RETURNING * delete by default and returns the driver rows', async () => {
    const rows = [{ sku: 'W-7', widget_id: 7 }];
    query.mockResolvedValue({ rows });

    const result = await deleteRows<{
      readonly sku: string;
      readonly widget_id: number;
    }>({
      filters: [{ column: 'widget_id', operator: 'eq', value: 7 }],
      schema: 'inventory',
      table: 'widgets',
    });

    expect(result).toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      'DELETE FROM "inventory"."widgets" WHERE "widget_id" = $1 RETURNING *',
      [7],
    );
  });

  it('propagates the unfiltered-delete guard without touching the pool', async () => {
    await expect(
      deleteRows({ filters: [], schema: 'inventory', table: 'widgets' }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });
});
