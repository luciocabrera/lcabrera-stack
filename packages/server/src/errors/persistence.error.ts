import type { PgErrorFields } from './errors.types.ts';

type PersistenceErrorArgs = {
  /** The driver rejection this replaces — kept for server-side logging only. */
  readonly cause: unknown;
  readonly fields: PgErrorFields;
  readonly message?: string;
};

const DEFAULT_MESSAGE = 'The database rejected the operation.';

/**
 * The base translated persistence failure, and the fallback for a rejection with
 * no SQLSTATE this package names.
 *
 * Two properties are the whole point. First, `message` is **ours**, never the
 * driver's: pg's message embeds table, column and index names, and every consumer
 * that stringifies an error was shipping those to the browser. Second, the
 * original rejection stays on `cause`, so a server log loses nothing.
 *
 * `UniqueConstraintViolationError` and `ForeignKeyViolationError` extend this, so
 * `error instanceof PersistenceError` is the one check that catches every
 * translated failure — including a future code this package starts naming.
 *
 * These are **classes, and server-only**. React Router's single fetch silently
 * drops functions, so an instance returned from a loader/action reaches the
 * client as a shape with no prototype: map one to a plain discriminated union at
 * the edge rather than returning it (ADR-050).
 */
export class PersistenceError extends Error {
  /** The pg diagnostics a consumer may branch on to route the failure. */
  public readonly fields: PgErrorFields;

  public constructor({ cause, fields, message }: PersistenceErrorArgs) {
    super(message ?? DEFAULT_MESSAGE, { cause });
    this.name = 'PersistenceError';
    this.fields = fields;
  }
}
