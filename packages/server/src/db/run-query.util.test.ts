import type { Pool } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { PersistenceError } from '../errors/persistence.error.ts';
import { UniqueConstraintViolationError } from '../errors/unique-constraint-violation.error.ts';
import { getPool } from './get-pool.util.ts';
import { runQuery } from './run-query.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();
const txQuery = vi.fn();
const tx = { query: txQuery } as unknown as TransactionClient;

beforeEach(() => {
  query.mockReset();
  txQuery.mockReset();
  vi.mocked(getPool).mockReturnValue({ query } as unknown as Pool);
});

describe('runQuery', () => {
  it('runs on the pool singleton when no tx is given', async () => {
    query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await runQuery({ text: 'SELECT 1', values: [] });

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(query).toHaveBeenCalledWith('SELECT 1', []);
    expect(txQuery).not.toHaveBeenCalled();
  });

  it('runs on the transaction client when tx is given, never touching the pool', async () => {
    txQuery.mockResolvedValue({ rows: [] });

    await runQuery({ text: 'SELECT $1', tx, values: ['a'] });

    expect(txQuery).toHaveBeenCalledWith('SELECT $1', ['a']);
    expect(query).not.toHaveBeenCalled();
  });

  it('copies the readonly values into the mutable array pg expects', async () => {
    query.mockResolvedValue({ rows: [] });
    const values: readonly unknown[] = ['a', 'b'];

    await runQuery({ text: 'SELECT $1, $2', values });

    expect(query.mock.calls[0]?.[1]).toEqual(['a', 'b']);
    expect(query.mock.calls[0]?.[1]).not.toBe(values);
  });

  it('translates a driver rejection instead of propagating it raw', async () => {
    query.mockRejectedValue(
      Object.assign(
        new Error(
          'duplicate key value violates unique constraint "orders_order_number_key"',
        ),
        { code: '23505', constraint: 'orders_order_number_key' },
      ),
    );

    await expect(runQuery({ text: 'INSERT', values: [] })).rejects.toThrow(
      UniqueConstraintViolationError,
    );
    await expect(runQuery({ text: 'INSERT', values: [] })).rejects.toThrow(
      'A record with these values already exists.',
    );
  });

  it('translates a rejection from the transaction client too', async () => {
    txQuery.mockRejectedValue(new Error('connection terminated'));

    await expect(
      runQuery({ text: 'SELECT 1', tx, values: [] }),
    ).rejects.toThrow(PersistenceError);
  });
});
