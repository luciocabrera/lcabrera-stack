import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { UniqueConstraintViolationError } from '../errors/unique-constraint-violation.error.ts';
import { getPool } from './get-pool.util.ts';
import { updateRows } from './update-rows.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('updateRows', () => {
  it('executes a RETURNING * update by default with offset WHERE params', async () => {
    const rows = [{ sku: 'W-9', widget_id: 42 }];
    query.mockResolvedValue({ rows });

    const result = await updateRows<{
      readonly sku: string;
      readonly widget_id: number;
    }>({
      filters: [{ column: 'widget_id', operator: 'eq', value: 42 }],
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W-9' },
    });

    expect(result).toEqual(rows);
    expect(query).toHaveBeenCalledWith(
      'UPDATE "inventory"."widgets" SET "sku" = $1 WHERE "widget_id" = $2 RETURNING *',
      ['W-9', 42],
    );
  });

  it('propagates the unfiltered-update guard without touching the pool', async () => {
    await expect(
      updateRows({
        filters: [],
        schema: 'inventory',
        table: 'widgets',
        values: { sku: 'W' },
      }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });

  it('runs on the transaction client when tx is passed, not the pool', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [] });

    await updateRows({
      filters: [{ column: 'widget_id', operator: 'eq', value: 42 }],
      schema: 'inventory',
      table: 'widgets',
      tx: { query: txQuery } as unknown as TransactionClient,
      values: { sku: 'W-9' },
    });

    expect(txQuery).toHaveBeenCalledWith(
      'UPDATE "inventory"."widgets" SET "sku" = $1 WHERE "widget_id" = $2 RETURNING *',
      ['W-9', 42],
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('translates a 23505 collision instead of leaking the driver message', async () => {
    query.mockRejectedValue(
      Object.assign(
        new Error(
          'duplicate key value violates unique constraint "widgets_sku_key"',
        ),
        { code: '23505', constraint: 'widgets_sku_key' },
      ),
    );

    await expect(
      updateRows({
        filters: [{ column: 'widget_id', operator: 'eq', value: 42 }],
        schema: 'inventory',
        table: 'widgets',
        values: { sku: 'W-9' },
      }),
    ).rejects.toThrow(UniqueConstraintViolationError);
  });
});
