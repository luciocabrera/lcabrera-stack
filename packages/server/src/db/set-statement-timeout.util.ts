import type { TransactionClient } from './db.types.ts';

import { runQuery } from './run-query.util.ts';

type SetStatementTimeoutArgs = {
  readonly timeoutMs: number;
  /**
   * **Required**, unlike every other executor's optional `tx`. The whole point
   * of this call is that the setting is scoped to a transaction, so there is no
   * meaningful pool-singleton branch: run it there and it either persists on a
   * pooled connection or is discarded, never what was asked for.
   */
  readonly tx: TransactionClient;
};

/**
 * Installs a `statement_timeout` for the rest of the current transaction only.
 *
 * Three things about the spelling are load-bearing, and each is a trap that was
 * hit before it was avoided (ADR-066):
 *
 * - **`set_config`, not `SET`.** `SET LOCAL statement_timeout = $1` is a syntax
 *   error: `SET` is a utility statement and cannot be prepared, so the value
 *   would have to be interpolated into the SQL text. `set_config` is an ordinary
 *   function call, so the value is a bound parameter like any other.
 * - **The third argument is `true`** — `is_local`. Without it the setting
 *   persists on the pooled connection after `COMMIT` and silently re-tunes every
 *   later query that borrows it. The classic pooling bug, and invisible: nothing
 *   fails, later queries just get a ceiling nobody chose.
 * - **`tx` is required.** Called without a transaction client this runs on the
 *   pool singleton, where `is_local` scopes it to a single implicit transaction —
 *   this statement's own — so it expires before the query it was meant to bound.
 *   That failure is silent too: the query still succeeds, unbounded.
 *
 * The value is passed as a string because `set_config`'s signature is
 * `(text, text, boolean)`; a bare integer means milliseconds.
 *
 * Transaction-locality cuts both ways, and the second edge is the one to
 * remember: the setting lasts until the transaction ends, so it governs
 * **every** later statement on `tx`, not only the next one. Call it on a
 * transaction you own, or on one whose remaining statements should share the
 * ceiling.
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
