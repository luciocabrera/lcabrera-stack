import type { TransactionClient } from './db.types.ts';

import { rollbackTransaction } from './rollback-transaction.util.ts';
import { runQuery } from './run-query.util.ts';

type RunInTransactionArgs<TResult> = {
  readonly client: TransactionClient;
  readonly run: (tx: TransactionClient) => Promise<TResult>;
};

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
