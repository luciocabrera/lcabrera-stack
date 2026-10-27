import type { TableResponseError } from '../Table.types';

import { isTableQueryRefusalReason } from './isTableQueryRefusalReason.util';

type QueryRefusedError = Extract<
  TableResponseError,
  { readonly kind: 'query-refused' }
>;

export const readQueryRefusedError = (
  error: unknown,
): QueryRefusedError | undefined => {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('kind' in error) ||
    error.kind !== 'query-refused' ||
    !('message' in error) ||
    typeof error.message !== 'string' ||
    !('reason' in error) ||
    !isTableQueryRefusalReason(error.reason)
  ) {
    return;
  }

  return {
    kind: 'query-refused',
    message: error.message,
    reason: error.reason,
  };
};
