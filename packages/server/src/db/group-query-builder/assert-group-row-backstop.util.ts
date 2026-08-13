import type { GroupRowLimit } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';

type AssertGroupRowBackstopArgs = {
  readonly rowCount: number;
  readonly rowLimit: GroupRowLimit;
};

/**
 * The other half of the row-limit backstop: a result that reached the guard's
 * own ceiling is refused rather than returned truncated.
 *
 * Returning it would be worse than refusing. Every row past the limit is
 * missing, so the subtotals do not add up and the grand total is absent — a
 * grouped result that is quietly wrong reads exactly like one that is right.
 *
 * Only fires when `resolveGroupRowLimit` marked the limit as a backstop, which
 * it does only when the pre-flight estimate was unavailable and the guard's
 * ceiling is the binding one.
 */
export const assertGroupRowBackstop = ({
  rowCount,
  rowLimit,
}: AssertGroupRowBackstopArgs): void => {
  if (rowLimit.backstopAt === undefined || rowCount < rowLimit.backstopAt) {
    return;
  }

  throw new GroupingRefusedError({
    estimatedRows: rowCount,
    message: `This grouping returned at least ${rowLimit.backstopAt} rows, past the ceiling, and the table has no statistics to estimate it from. Group by fewer columns, filter the rows down, or ANALYZE the table.`,
    reason: 'row-limit-reached',
  });
};
