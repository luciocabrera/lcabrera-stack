import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type UniqueConstraintViolationErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

/** SQLSTATE `23505` — a row collided with a unique index or primary key. */
export class UniqueConstraintViolationError extends PersistenceError {
  public constructor({ cause, fields }: UniqueConstraintViolationErrorArgs) {
    super({
      cause,
      fields,
      message: 'A record with these values already exists.',
    });
    this.name = 'UniqueConstraintViolationError';
  }
}
