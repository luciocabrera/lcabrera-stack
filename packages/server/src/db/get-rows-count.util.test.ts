import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { getRowsCount } from './get-rows-count.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();

beforeEach(() => {
  query.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('getRowsCount', () => {
  it('counts the given column and returns the numeric total', async () => {
    query.mockResolvedValue({ rows: [{ count: 5 }] });

    const result = await getRowsCount({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toBe(5);
    expect(query).toHaveBeenCalledWith(
      'SELECT count("order_id") AS count FROM "public"."enterprise_orders"',
      [],
    );
  });

  it('reuses the data query WHERE clause via shared filters', async () => {
    query.mockResolvedValue({ rows: [{ count: 2 }] });

    const result = await getRowsCount({
      allowedColumns: ['order_id', 'order_status'],
      column: 'order_id',
      filters: [{ column: 'order_status', operator: 'eq', value: 'Pending' }],
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toBe(2);
    expect(query).toHaveBeenCalledWith(
      'SELECT count("order_id") AS count FROM "public"."enterprise_orders" WHERE "order_status" = $1',
      ['Pending'],
    );
  });

  it('coerces a string count (wide integer types) to a number', async () => {
    query.mockResolvedValue({ rows: [{ count: '99' }] });

    const result = await getRowsCount({
      column: 'car_id',
      schema: 'public',
      table: 'car_sales',
    });

    expect(result).toBe(99);
  });

  it('returns 0 for an empty result set', async () => {
    query.mockResolvedValue({ rows: [] });

    const result = await getRowsCount({
      column: 'id',
      schema: 'public',
      table: 'wide_alltypes_150',
    });

    expect(result).toBe(0);
  });

  it('propagates the builder rejection without touching the pool', async () => {
    await expect(
      getRowsCount({
        column: 'id; DROP TABLE users',
        schema: 'public',
        table: 'widgets',
      }),
    ).rejects.toThrow();

    expect(query).not.toHaveBeenCalled();
  });
});
