import type { TransactionClient } from './db.types.ts';

import { getPool } from './get-pool.util.ts';
import { runInTransaction } from './run-in-transaction.util.ts';

type WithTransactionArgs<TResult> = {
  readonly run: (tx: TransactionClient) => Promise<TResult>;
};

/**
 * An allocation like `MAX(id) + 1` still needs a lock or a retry on the typed conflict on
 * top of this — see ADR-051, which picks the strategy.
 */
export const withTransaction = async <TResult>({
  run,
}: WithTransactionArgs<TResult>) => {
  const client = await getPool().connect();

  try {
    return await runInTransaction({ client, run });
  } finally {
    // Released plainly even when the ROLLBACK itself failed: that only happens
    // when the connection is already broken, and pg's Pool discards a client that
    // has emitted `error` rather than lending it out again.
    client.release();
  }
};
