import type { TransactionClient } from './db.types.ts';

import { rollbackTransaction } from './rollback-transaction.util.ts';

type RunInTransactionArgs<TResult> = {
  readonly client: TransactionClient;
  readonly run: (tx: TransactionClient) => Promise<TResult>;
};

/**
 * BEGIN/COMMIT/ROLLBACK around `run`, on a connection the caller owns.
 *
 * It neither opens nor closes the connection. That is `withTransaction`'s job for
 * a pooled one, and this half exists separately for the caller that already has a
 * `pg.Client` of its own — the migration runner connects to a different database
 * than the pool does, so it cannot borrow from the pool and still needs the same
 * BEGIN/COMMIT/ROLLBACK shape.
 *
 * Everything `run` does on `tx` is inside the transaction; anything it does
 * through the pool singleton instead (an executor called without `tx`) is **not**,
 * which is the one trap here — thread `tx` through every write that must be atomic.
 */
export const runInTransaction = async <TResult>({
  client,
  run,
}: RunInTransactionArgs<TResult>) => {
  await client.query('BEGIN');

  try {
    const result = await run(client);
    await client.query('COMMIT');

    return result;
  } catch (error) {
    await rollbackTransaction({ client });
    throw error;
  }
};
