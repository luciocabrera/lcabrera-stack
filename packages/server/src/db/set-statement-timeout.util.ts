import type { TransactionClient } from './db.types.ts';

import { runQuery } from './run-query.util.ts';

type SetStatementTimeoutArgs = {
  readonly timeoutMs: number;
  readonly tx: TransactionClient;
};

export const setStatementTimeout = async ({
  timeoutMs,
  tx,
}: SetStatementTimeoutArgs) => {
  await runQuery({
    text: `SELECT set_config('statement_timeout', $1, true)`,
    tx,
    values: [String(timeoutMs)],
  });
};
