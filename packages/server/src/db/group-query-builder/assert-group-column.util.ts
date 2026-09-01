import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';

type AssertGroupColumnArgs = {
  readonly allowedColumns: readonly string[];
  readonly column: string;
};

export const assertGroupColumn = ({
  allowedColumns,
  column,
}: AssertGroupColumnArgs) => {
  try {
    assertSafeIdentifier(column);
    assertColumnAllowed({ allowedColumns, column });
  } catch (error) {
    throw new GroupingRefusedError({
      cause: error,
      column,
      message:
        error instanceof Error
          ? error.message
          : `Column "${column}" cannot be used in a grouped query.`,
      reason: 'unknown-column',
    });
  }
};
