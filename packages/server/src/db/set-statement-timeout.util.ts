import type { TransactionClient } from './db.types.ts';

import { runQuery } from './run-query.util.ts';

type SetStatementTimeoutArgs = {
  readonly timeoutMs: number;
  /**
   * The whole point of this call is that the setting is scoped to a transaction, so there is
   * no meaningful pool-singleton branch: run it there and it either persists on a pooled
   * connection or is discarded, never what was asked for.
   */
  readonly tx: TransactionClient;
};

/**
 * Three spelling traps (ADR-066): `set_config` not `SET` (SET cannot take a bound
 * parameter); the third argument must be `true` (`is_local`) or the setting sticks on the
 * pooled connection; `tx` is required or `is_local` expires before the query it was meant
 * to bound.
 */
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
