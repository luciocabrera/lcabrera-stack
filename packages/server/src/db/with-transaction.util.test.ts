import type { Pool, PoolClient } from 'pg';

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { getPool } from './get-pool.util.ts';
import { withTransaction } from './with-transaction.util.ts';

// The pool is the one impure edge here; stubbing it keeps this package's
// suite DB-free (ADR-032) while still asserting the exact SQL that reaches pg.
vi.mock('./get-pool.util.ts', () => ({ getPool: vi.fn() }));

const query = vi.fn();
const release = vi.fn();
const connect = vi.fn();

const statements = () => query.mock.calls.map(([text]) => text);

beforeEach(() => {
  query.mockReset();
  release.mockReset();
  connect.mockReset();
  query.mockResolvedValue({ rows: [] });
  connect.mockResolvedValue({ query, release } as unknown as PoolClient);
  vi.mocked(getPool).mockReturnValue({ connect } as unknown as Pool);
});

describe('withTransaction', () => {
  it('borrows a connection, commits, and releases it', async () => {
    const result = await withTransaction({
      run: async () => 42,
    });

    expect(result).toBe(42);
    expect(statements()).toEqual(['BEGIN', 'COMMIT']);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('hands the callback the borrowed client, so executors can thread it as tx', async () => {
    const run = vi.fn().mockResolvedValue(undefined);

    await withTransaction({ run });

    expect(run).toHaveBeenCalledWith(await connect.mock.results[0]?.value);
  });

  it('rolls back, releases, and rethrows the original error', async () => {
    const failure = new Error('insert exploded');

    await expect(
      withTransaction({
        run: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
    expect(statements()).toEqual(['BEGIN', 'ROLLBACK']);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('releases the connection even when the ROLLBACK also fails', async () => {
    query.mockImplementation(async (text: string) =>
      text === 'BEGIN'
        ? Promise.resolve({ rows: [] })
        : Promise.reject(new Error('connection terminated')),
    );

    await expect(
      withTransaction({
        run: async () => {
          throw new Error('boom');
        },
      }),
    ).rejects.toThrow('boom');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('releases the connection when BEGIN itself fails', async () => {
    query.mockRejectedValue(new Error('no connection'));

    await expect(withTransaction({ run: async () => 1 })).rejects.toThrow(
      'no connection',
    );
    expect(release).toHaveBeenCalledTimes(1);
  });
});
