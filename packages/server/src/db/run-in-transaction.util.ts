import type { TransactionClient } from './db.types.ts';

import { rollbackTransaction } from './rollback-transaction.util.ts';
import { runQuery } from './run-query.util.ts';

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
 *
 * **BEGIN and COMMIT go through `runQuery`, `run`'s own rejection does not.**
 * They were the last two statements in the package to reach the driver
 * untranslated (ADR-050), which mattered little while only explicit multi-step
 * writes opened a transaction and matters more now that every grouped *read*
 * does. `run`'s throw is rethrown untouched on purpose: it has already been
 * translated by whatever executor raised it, and re-mapping it would bury a
 * `GroupingRefusedError` — which is not a driver failure at all — under a
 * generic `PersistenceError`.
 */
export const runInTransaction = async <TResult>({
  client,
  run,
}: RunInTransactionArgs<TResult>) => {
  await runQuery({ text: 'BEGIN', tx: client, values: [] });

  try {
    const result = await run(client);
    await runQuery({ text: 'COMMIT', tx: client, values: [] });

    return result;
  } catch (error) {
    await rollbackTransaction({ client });
    throw error;
  }
};
