import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from './getPool.util.ts';
import { insertRow } from './insertRow.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./getPool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('insertRow', () => {
  it('executes a RETURNING * insert by default and returns the driver rows', async () => {
    const rows = [{ sku: 'W-1', widget_id: 1 }];
    query.mockResolvedValue({ rows });

    const result = await insertRow<{
      readonly sku: string;
      readonly widget_id: number;
    }>({
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W-1' },
    });

    expect(result).toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      'INSERT INTO "inventory"."widgets" ("sku") VALUES ($1) RETURNING *',
      ['W-1'],
    );
  });

  it('honors an explicit RETURNING projection from the descriptor', async () => {
    query.mockResolvedValue({ rows: [] });

    await insertRow({
      returning: ['widget_id'],
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W-2' },
    });

    expect(query).toHaveBeenCalledWith(
      'INSERT INTO "inventory"."widgets" ("sku") VALUES ($1) RETURNING "widget_id"',
      ['W-2'],
    );
  });

  it('propagates the builder rejection without touching the pool', async () => {
    await expect(
      insertRow({ schema: 'inventory', table: 'widgets', values: {} }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });
});
