import type { DatabaseError } from 'pg';

import type { PgErrorFields } from './errors.types.ts';

/**
 * The pg diagnostics carried by an unknown rejection — `{}` when it carries none.
 *
 * Widening to the driver's own type rather than testing `instanceof
 * DatabaseError` is the same call `hasPostgresErrorCode` makes for the same
 * reason: two copies of `pg` in a consumer's graph defeat `instanceof`. Every
 * field read here is optional on that type, so the widening asserts nothing that
 * is not already true of any `Error`. `name` is omitted from it because pg types
 * that field as a closed union of its own message names, which no ordinary
 * `Error` satisfies.
 */
export const readPgErrorFields = (error: unknown): PgErrorFields => {
  const source: Partial<Omit<DatabaseError, 'name'>> =
    error instanceof Error ? error : {};

  return {
    code: source.code,
    column: source.column,
    constraint: source.constraint,
  };
};
