import type { TableResponseError } from '#ui/components/Table/Table.types';

import { isTableGroupingRefusalReason } from './isTableGroupingRefusalReason.util';

type ToTableResponseErrorArgs = {
  readonly error: unknown;
  readonly fallback: string;
};

export const toTableResponseError = ({
  error,
  fallback,
}: ToTableResponseErrorArgs): TableResponseError => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    if (error.kind === 'db-canceled' || error.kind === 'unexpected') {
      return { kind: error.kind, message: error.message };
    }

    if (error.kind === 'db-failed') {
      return {
        kind: 'db-failed',
        message: error.message,
        ...('code' in error &&
          typeof error.code === 'string' && { code: error.code }),
      };
    }

    if (
      error.kind === 'grouping-refused' &&
      'reason' in error &&
      isTableGroupingRefusalReason(error.reason)
    ) {
      return {
        kind: 'grouping-refused',
        message: error.message,
        reason: error.reason,
        ...('column' in error &&
          typeof error.column === 'string' && { column: error.column }),
        ...('estimatedRows' in error &&
          typeof error.estimatedRows === 'number' && {
            estimatedRows: error.estimatedRows,
          }),
      };
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return {
      kind: 'db-canceled',
      message: error.message === '' ? fallback : error.message,
    };
  }

  if (error instanceof Error) {
    return {
      kind: 'db-failed',
      message: error.message,
    };
  }

  return {
    kind: 'unexpected',
    message: fallback,
  };
};
