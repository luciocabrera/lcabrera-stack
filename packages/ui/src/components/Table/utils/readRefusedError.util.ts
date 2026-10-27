import { isTableGroupingRefusalReason } from './isTableGroupingRefusalReason.util';
import { isTableQueryRefusalReason } from './isTableQueryRefusalReason.util';

export const readRefusedError = (error: unknown) => {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('kind' in error) ||
    !('message' in error) ||
    typeof error.message !== 'string' ||
    !('reason' in error)
  ) {
    return;
  }

  if (error.kind === 'query-refused' && isTableQueryRefusalReason(error.reason))
    return {
      kind: 'query-refused' as const,
      message: error.message,
      reason: error.reason,
    };

  if (
    error.kind !== 'grouping-refused' ||
    !isTableGroupingRefusalReason(error.reason)
  )
    return;

  return {
    kind: 'grouping-refused' as const,
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
