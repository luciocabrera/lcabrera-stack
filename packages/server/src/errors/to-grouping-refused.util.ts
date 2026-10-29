import type { GroupingRefusedError } from './grouping-refused.error.ts';

import { GROUPING_REFUSALS } from './errors.constants.ts';

export const toGroupingRefused = (error: GroupingRefusedError) => {
  const { echoesColumn, message } = GROUPING_REFUSALS[error.reason];

  return {
    kind: 'grouping-refused' as const,
    message,
    reason: error.reason,
    ...(echoesColumn && error.column !== undefined && { column: error.column }),
    ...(error.estimatedRows !== undefined && {
      estimatedRows: error.estimatedRows,
    }),
  };
};
