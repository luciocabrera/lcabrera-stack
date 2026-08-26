import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';

type AssertGroupColumnArgs = {
  readonly allowedColumns: readonly string[];
  readonly column: string;
};

/**
 * The two shared column assertions, raised as a **typed** grouping refusal.
 * `assertSafeIdentifier` and `assertColumnAllowed` are shared with the flat builder, so
 * they cannot throw a grouping-shaped error of their own — a flat `selectRows` refusing a
 * column has nothing to do with grouping.
 */
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
