import type { TableResponseError } from '../Table.types';

import { isTableGroupingRefusalReason } from './isTableGroupingRefusalReason.util';

type GroupingRefusedError = Extract<
  TableResponseError,
  { readonly kind: 'grouping-refused' }
>;

export const readGroupingRefusedError = (
  error: unknown,
): GroupingRefusedError | undefined => {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('kind' in error) ||
    error.kind !== 'grouping-refused' ||
    !('message' in error) ||
    typeof error.message !== 'string' ||
    !('reason' in error) ||
    !isTableGroupingRefusalReason(error.reason)
  ) {
    return;
  }

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
};
