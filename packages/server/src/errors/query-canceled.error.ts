import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type QueryCanceledErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

/**
 * SQLSTATE `57014` — Postgres stopped the statement before it finished.
 *
 * **Named for the SQLSTATE, not for the cause.** `statement_timeout` raises it,
 * and so does `pg_cancel_backend` from an administrator or a supervisor process;
 * a `StatementTimeoutError` would be a claim the code cannot support. What the
 * consumer can act on either way is the same: the work was abandoned, nothing
 * was returned, and retrying a narrower query is the move.
 *
 * Extends `PersistenceError` so one `instanceof` still catches every translated
 * failure (ADR-050).
 */
export class QueryCanceledError extends PersistenceError {
  public constructor({ cause, fields }: QueryCanceledErrorArgs) {
    super({
      cause,
      fields,
      message:
        'The database stopped the query before it finished. Narrow it and try again.',
    });
    this.name = 'QueryCanceledError';
  }
}
