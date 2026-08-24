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
 * Installs a `statement_timeout` for the rest of the current transaction only.
 * Three things about the spelling are load-bearing, and each is a trap that was hit before
 * it was avoided (ADR-066): - **`set_config`, not `SET`.** `SET LOCAL statement_timeout =
 * $1` is a syntax error: `SET` is a utility statement and cannot be prepared, so the value
 * would have to be interpolated into the SQL text.
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
