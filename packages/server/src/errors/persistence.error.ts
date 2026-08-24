import type { PgErrorFields } from './errors.types.ts';

type PersistenceErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
  readonly message?: string;
};

const DEFAULT_MESSAGE = 'The database rejected the operation.';

/**
 * The base translated persistence failure, and the fallback for a rejection with no
 * SQLSTATE this package names.
 * First, `message` is **ours**, never the driver's: pg's message embeds table, column and
 * index names, and every consumer that stringifies an error was shipping those to the
 * browser.
 */
export class PersistenceError extends Error {
  public readonly fields: PgErrorFields;

  public constructor({ cause, fields, message }: PersistenceErrorArgs) {
    super(message ?? DEFAULT_MESSAGE, { cause });
    this.name = 'PersistenceError';
    this.fields = fields;
  }
}
