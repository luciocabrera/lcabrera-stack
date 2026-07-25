import type { TransactionClient } from './db.types.ts';

import { getPool } from './get-pool.util.ts';
import { runInTransaction } from './run-in-transaction.util.ts';

type WithTransactionArgs<TResult> = {
  readonly run: (tx: TransactionClient) => Promise<TResult>;
};

/**
 * Runs `run` on a single pooled connection inside a transaction, committing its
 * result and rolling back on a throw. The connection is always released.
 *
 * This is the seam that makes a multi-step write atomic: pass the `tx` it hands
 * you to every executor in the sequence (`insertRow({ …, tx })`). An executor
 * called **without** `tx` uses the pool singleton, so it runs on a different
 * connection and outside the transaction — that is the mistake to watch for, and
 * the reason the parameter is named rather than implicit.
 *
 * A transaction narrows a read-then-write race; under READ COMMITTED it does not
 * close one. An allocation like `MAX(id) + 1` still needs a lock or a retry on the
 * typed conflict on top of this — see ADR-051, which picks the strategy.
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
