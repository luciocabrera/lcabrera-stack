import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { ForeignKeyViolationError } from '../errors/foreign-key-violation.error.ts';
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

  it('runs on the transaction client when tx is passed, not the pool', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [] });

    await deleteRows({
      filters: [{ column: 'widget_id', operator: 'eq', value: 7 }],
      schema: 'inventory',
      table: 'widgets',
      tx: { query: txQuery } as unknown as TransactionClient,
    });

    expect(txQuery).toHaveBeenCalledWith(
      'DELETE FROM "inventory"."widgets" WHERE "widget_id" = $1 RETURNING *',
      [7],
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('translates a 23503 rejection from a child row still referencing the target', async () => {
    query.mockRejectedValue(
      Object.assign(
        new Error(
          'update or delete on table "widgets" violates foreign key constraint "parts_widget_id_fkey" on table "parts"',
        ),
        { code: '23503', constraint: 'parts_widget_id_fkey' },
      ),
    );

    const rejects = expect(
      deleteRows({
        filters: [{ column: 'widget_id', operator: 'eq', value: 7 }],
        schema: 'inventory',
        table: 'widgets',
      }),
    ).rejects;

    await rejects.toThrow(ForeignKeyViolationError);
    // The safe message, not the driver's — asserting the exact string is what
    // proves the pg text did not survive the translation.
    await rejects.toThrow('A referenced record does not exist.');
    await rejects.toMatchObject({
      fields: { constraint: 'parts_widget_id_fkey' },
    });
  });
});
