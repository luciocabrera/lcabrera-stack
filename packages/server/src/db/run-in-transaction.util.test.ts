import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TransactionClient } from './db.types.ts';

import { runInTransaction } from './run-in-transaction.util.ts';

const query = vi.fn();
const client = { query } as unknown as TransactionClient;

const statements = () => query.mock.calls.map(([text]) => text);

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ rows: [] });
});

describe('runInTransaction', () => {
  it('commits and returns the callback result', async () => {
    const result = await runInTransaction({
      client,
      run: async () => 'done',
    });

    expect(result).toBe('done');
    expect(statements()).toEqual(['BEGIN', 'COMMIT']);
  });

  it('hands the callback the same client it was given', async () => {
    const run = vi.fn().mockResolvedValue(undefined);

    await runInTransaction({ client, run });

    expect(run).toHaveBeenCalledWith(client);
  });

  it('rolls back and rethrows the original error on a failed callback', async () => {
    const failure = new Error('insert exploded');

    await expect(
      runInTransaction({
        client,
        run: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
    expect(statements()).toEqual(['BEGIN', 'ROLLBACK']);
  });

  it('still surfaces the original error when the ROLLBACK itself fails', async () => {
    const failure = new Error('insert exploded');
    query.mockImplementation(async (text: string) =>
      text === 'ROLLBACK'
        ? Promise.reject(new Error('connection terminated'))
        : Promise.resolve({ rows: [] }),
    );

    await expect(
      runInTransaction({
        client,
        run: async () => {
          throw failure;
        },
      }),
    ).rejects.toBe(failure);
  });

  it('does not swallow a failing COMMIT', async () => {
    const failure = new Error('could not serialize access');
    query.mockImplementation(async (text: string) =>
      text === 'COMMIT'
        ? Promise.reject(failure)
        : Promise.resolve({ rows: [] }),
    );

    await expect(
      runInTransaction({ client, run: async () => 'x' }),
    ).rejects.toBe(failure);
    expect(statements()).toEqual(['BEGIN', 'COMMIT', 'ROLLBACK']);
  });
});
