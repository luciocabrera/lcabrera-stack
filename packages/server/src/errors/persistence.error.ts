import type { PgErrorFields } from './errors.types.ts';

type PersistenceErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
  readonly message?: string;
};

const DEFAULT_MESSAGE = 'The database rejected the operation.';

export class PersistenceError extends Error {
  public readonly fields: PgErrorFields;

  public constructor({ cause, fields, message }: PersistenceErrorArgs) {
    super(message ?? DEFAULT_MESSAGE, { cause });
    this.name = 'PersistenceError';
    this.fields = fields;
  }
}
