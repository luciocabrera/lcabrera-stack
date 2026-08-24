import type { GroupRowLimit } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';

type AssertGroupRowBackstopArgs = {
  readonly rowCount: number;
  readonly rowLimit: GroupRowLimit;
};

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
