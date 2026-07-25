import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type ForeignKeyViolationErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

/**
 * SQLSTATE `23503` — a row referenced a parent that does not exist, or a delete
 * would have orphaned a child.
 *
 * The two directions arrive as the same code, and `fields.constraint` is what
 * tells them apart: on an insert/update it names the FK on the row being written,
 * on a delete it names the FK on the row still pointing at it. A consumer that
 * needs to distinguish them reads the constraint, not the error type.
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
