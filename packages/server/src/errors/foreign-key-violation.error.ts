import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type ForeignKeyViolationErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

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
