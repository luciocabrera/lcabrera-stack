import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { PersistenceError } from '../errors/persistence.error.ts';
import { getMaxValue } from './get-max-value.util.ts';
import { getPool } from './get-pool.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('getMaxValue', () => {
  it('runs the max query and returns the numeric maximum', async () => {
    query.mockResolvedValue({ rows: [{ max: 42 }] });

    const result = await getMaxValue({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toBe(42);
    expect(query).toHaveBeenCalledWith(
      'SELECT COALESCE(MAX("order_id"), 0) AS max FROM "public"."enterprise_orders"',
      [],
    );
  });

  it('coerces a string max (wide integer types) to a number', async () => {
    query.mockResolvedValue({ rows: [{ max: '99' }] });

    const result = await getMaxValue({
      column: 'widget_id',
      schema: 'inventory',
      table: 'widgets',
    });

    expect(result).toBe(99);
  });

  it('propagates the builder rejection without touching the pool', async () => {
    await expect(
      getMaxValue({
        column: 'id; DROP TABLE users',
        schema: 'public',
        table: 'widgets',
      }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });

  it('reads on the transaction client when tx is passed — the atomic-allocation path', async () => {
    const txQuery = vi.fn().mockResolvedValue({ rows: [{ max: 7 }] });

    const result = await getMaxValue({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
      tx: { query: txQuery } as unknown as TransactionClient,
    });

    expect(result).toBe(7);
    expect(txQuery).toHaveBeenCalledWith(
      'SELECT COALESCE(MAX("order_id"), 0) AS max FROM "public"."enterprise_orders"',
      [],
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('translates a driver rejection', async () => {
    query.mockRejectedValue(new Error('connection terminated unexpectedly'));

    await expect(
      getMaxValue({
        column: 'order_id',
        schema: 'public',
        table: 'enterprise_orders',
      }),
    ).rejects.toThrow(PersistenceError);
  });
});
