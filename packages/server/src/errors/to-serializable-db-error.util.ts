import type {
  QueryRefusalReason,
  SerializableDbError,
} from './errors.types.ts';

import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';

const UNEXPECTED_MESSAGE = 'The request could not be completed.';

const QUERY_REFUSED_MESSAGES: Readonly<Record<QueryRefusalReason, string>> = {
  'column-not-allowed': 'The request named a column this query does not allow.',
  'keyset-cursor-mismatch':
    'The request sent a cursor that does not match its sort.',
  'keyset-sort-missing': 'The request sent a cursor without a sort.',
  'keyset-sort-not-unique':
    'The request sent a cursor with a sort that does not end on the unique column.',
  'keyset-unique-value-missing':
    'The request sent a cursor with no value for the unique column.',
};

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

  if (error instanceof QueryRefusedError) {
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
