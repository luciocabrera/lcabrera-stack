import {
  SQLSTATE_FOREIGN_KEY_VIOLATION,
  SQLSTATE_QUERY_CANCELED,
  SQLSTATE_UNIQUE_VIOLATION,
} from './errors.constants.ts';
import { ForeignKeyViolationError } from './foreign-key-violation.error.ts';
import { hasPostgresErrorCode } from './has-postgres-error-code.util.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { readPgErrorFields } from './read-pg-error-fields.util.ts';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error.ts';

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

  if (hasPostgresErrorCode({ code: SQLSTATE_QUERY_CANCELED, error })) {
    return new QueryCanceledError({ cause: error, fields });
  }

  return new PersistenceError({ cause: error, fields });
};
