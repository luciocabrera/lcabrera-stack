import {
  SQLSTATE_FOREIGN_KEY_VIOLATION,
  SQLSTATE_UNIQUE_VIOLATION,
} from './errors.constants.ts';
import { ForeignKeyViolationError } from './foreign-key-violation.error.ts';
import { hasPostgresErrorCode } from './has-postgres-error-code.util.ts';
import { PersistenceError } from './persistence.error.ts';
import { readPgErrorFields } from './read-pg-error-fields.util.ts';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error.ts';

/**
 * Translates a driver rejection into this package's typed errors: `23505` →
 * `UniqueConstraintViolationError`, `23503` → `ForeignKeyViolationError`,
 * anything else → `PersistenceError`.
 *
 * It **returns** the error rather than throwing it, so a caller writes
 * `throw mapDbError(error)` and keeps its own control flow visible.
 *
 * An already-translated error passes through untouched. That is not a nicety: the
 * executors compose (`selectFilterOptions` → `selectDistinctRows` → `selectRows`),
 * so a rejection can meet this function more than once, and re-wrapping would bury
 * the specific type under a generic `PersistenceError` and lengthen the `cause`
 * chain on every hop.
 */
export const mapDbError = (error: unknown) => {
  if (error instanceof PersistenceError) {
    return error;
  }

  const fields = readPgErrorFields(error);

  if (hasPostgresErrorCode({ code: SQLSTATE_UNIQUE_VIOLATION, error })) {
    return new UniqueConstraintViolationError({ cause: error, fields });
  }

  if (hasPostgresErrorCode({ code: SQLSTATE_FOREIGN_KEY_VIOLATION, error })) {
    return new ForeignKeyViolationError({ cause: error, fields });
  }

  return new PersistenceError({ cause: error, fields });
};
