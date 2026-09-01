import type { TransactionClient } from './db.types.ts';

import { getPool } from './get-pool.util.ts';
import { runInTransaction } from './run-in-transaction.util.ts';

type WithTransactionArgs<TResult> = {
  readonly run: (tx: TransactionClient) => Promise<TResult>;
};

export const withTransaction = async <TResult>({
  run,
}: WithTransactionArgs<TResult>) => {
  const client = await getPool().connect();

  try {
    return await runInTransaction({ client, run });
  } finally {
    client.release();
  }
};
