import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type ForeignKeyViolationErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

/**
 * SQLSTATE `23503` — a row referenced a parent that does not exist, or a delete would have
 * orphaned a child.
 */
export class ForeignKeyViolationError extends PersistenceError {
  public constructor({ cause, fields }: ForeignKeyViolationErrorArgs) {
    super({
      cause,
      fields,
      message: 'A referenced record does not exist.',
    });
    this.name = 'ForeignKeyViolationError';
  }
}
