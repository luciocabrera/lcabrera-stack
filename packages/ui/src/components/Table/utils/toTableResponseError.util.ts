import type { TableResponseError } from '#ui/components/Table/Table.types';

import { readGroupingRefusedError } from './readGroupingRefusedError.util';

type ToTableResponseErrorArgs = {
  readonly error: unknown;
  readonly fallback: string;
};

export const toTableResponseError = ({
  error,
  fallback,
}: ToTableResponseErrorArgs): TableResponseError => {
  const groupingRefused = readGroupingRefusedError(error);
  if (groupingRefused !== undefined) {
    return groupingRefused;
  }

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
