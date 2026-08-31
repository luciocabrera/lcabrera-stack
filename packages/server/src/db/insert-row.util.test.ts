import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { ForeignKeyViolationError } from '../errors/foreign-key-violation.error.ts';
import { UniqueConstraintViolationError } from '../errors/unique-constraint-violation.error.ts';
import { getPool } from './get-pool.util.ts';
import { insertRow } from './insert-row.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

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

  it('runs on the transaction client when tx is passed, not the pool', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [] });

    await insertRow({
      schema: 'inventory',
      table: 'widgets',
      tx: { query: txQuery } as unknown as TransactionClient,
      values: { sku: 'W-3' },
    });

    expect(txQuery).toHaveBeenCalledWith(
      'INSERT INTO "inventory"."widgets" ("sku") VALUES ($1) RETURNING *',
      ['W-3'],
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

    const rejects = expect(
      insertRow({
        schema: 'inventory',
        table: 'widgets',
        values: { sku: 'W-1' },
      }),
    ).rejects;

    await rejects.toThrow(UniqueConstraintViolationError);
    await rejects.toThrow('A record with these values already exists.');
    await rejects.toMatchObject({ fields: { constraint: 'widgets_sku_key' } });
  });

  it('translates a 23503 foreign-key rejection', async () => {
    query.mockRejectedValue(
      Object.assign(new Error('violates foreign key constraint'), {
        code: '23503',
      }),
    );

    await expect(
      insertRow({
        schema: 'inventory',
        table: 'widgets',
        values: { sku: 'W-1' },
      }),
    ).rejects.toThrow(ForeignKeyViolationError);
  });
});
