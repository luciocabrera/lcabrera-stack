import type { SerializableDbError } from './errors.types.ts';

import {
  GROUPING_REFUSED_MESSAGES,
  QUERY_REFUSED_MESSAGES,
} from './errors.constants.ts';
import { GroupingRefusedError } from './grouping-refused.error.ts';
import { isQueryRefusalReason } from './is-query-refusal-reason.util.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';

const UNEXPECTED_MESSAGE = 'The request could not be completed.';

const toGroupingRefused = (
  error: GroupingRefusedError,
): SerializableDbError => {
  const fixedMessage = GROUPING_REFUSED_MESSAGES[error.reason];

  return {
    kind: 'grouping-refused',
    message: fixedMessage ?? error.message,
    reason: error.reason,
    ...(fixedMessage === undefined &&
      error.column !== undefined && { column: error.column }),
    ...(error.estimatedRows !== undefined && {
      estimatedRows: error.estimatedRows,
    }),
  };
};

export const toSerializableDbError = (error: unknown): SerializableDbError => {
  if (error instanceof GroupingRefusedError) return toGroupingRefused(error);

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
