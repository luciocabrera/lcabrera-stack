import type {
  TableGroupingRefusalReason,
  TableQueryRefusalReason,
} from '../Table.types';

import { createTableRefusalReasonGuard } from './createTableRefusalReasonGuard.util';

const isGroupingRefusalReason =
  createTableRefusalReasonGuard<TableGroupingRefusalReason>({
    'aggregate-not-legal': true,
    'column-axis-too-wide': true,
    'column-not-groupable': true,
    'duplicate-keys': true,
    'estimate-too-large': true,
    'no-keys': true,
    'row-limit-reached': true,
    'too-many-keys': true,
    'unknown-column': true,
  });

const isQueryRefusalReason =
  createTableRefusalReasonGuard<TableQueryRefusalReason>({
    'column-not-allowed': true,
    'keyset-cursor-mismatch': true,
    'keyset-sort-missing': true,
    'keyset-sort-not-unique': true,
    'keyset-unique-value-missing': true,
  });

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

  if (error.kind === 'query-refused' && isQueryRefusalReason(error.reason))
    return {
      kind: 'query-refused' as const,
      message: error.message,
      reason: error.reason,
    };

  if (
    error.kind !== 'grouping-refused' ||
    !isGroupingRefusalReason(error.reason)
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
