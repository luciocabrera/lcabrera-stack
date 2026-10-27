import type { SerializableDbError } from './errors.types.ts';

import { QUERY_REFUSED_MESSAGES } from './errors.constants.ts';
import { GroupingRefusedError } from './grouping-refused.error.ts';
import { isQueryRefusalReason } from './is-query-refusal-reason.util.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';

const UNEXPECTED_MESSAGE = 'The request could not be completed.';

export const toSerializableDbError = (error: unknown): SerializableDbError => {
  if (error instanceof GroupingRefusedError) {
    return {
      kind: 'grouping-refused',
      message: error.message,
      reason: error.reason,
      ...(error.column !== undefined && { column: error.column }),
      ...(error.estimatedRows !== undefined && {
        estimatedRows: error.estimatedRows,
      }),
    };
  }

  if (
    error instanceof QueryRefusedError &&
    isQueryRefusalReason(error.reason)
  ) {
    return {
      kind: 'query-refused',
      message: QUERY_REFUSED_MESSAGES[error.reason],
      reason: error.reason,
    };
  }

  if (error instanceof QueryCanceledError) {
    return { kind: 'db-canceled', message: error.message };
  }

  if (error instanceof PersistenceError) {
    return {
      kind: 'db-failed',
      message: error.message,
      ...(error.fields.code !== undefined && { code: error.fields.code }),
    };
  }

  return { kind: 'unexpected', message: UNEXPECTED_MESSAGE };
};
