import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type UniqueConstraintViolationErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

/**
 * SQLSTATE `23505` — a row collided with a unique index or primary key.
 *
 * `fields.constraint` names the index Postgres refused (`orders_order_number_key`),
 * which is what a consumer maps to the form field that owns it. pg leaves
 * `column` unset for this class, so the constraint name is the only routing key
 * there is — mapping it is the consumer's job, since only the consumer knows its
 * own schema.
 */
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
