import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';

type AssertGroupColumnArgs = {
  readonly allowedColumns: readonly string[];
  readonly column: string;
};

/**
 * The two shared column assertions, raised as a **typed** grouping refusal.
 *
 * `assertSafeIdentifier` and `assertColumnAllowed` are shared with the flat
 * builder, so they cannot throw a grouping-shaped error of their own — a flat
 * `selectRows` refusing a column has nothing to do with grouping. Left
 * unwrapped, though, they are the one hole in this module's error contract: a
 * key outside `allowedColumns` reaches the loader edge as
 * `{ kind: 'unexpected' }` with its message withheld, which is the arm reserved
 * for a throw this package never vetted (ADR-066).
 *
 * The message **is** forwarded, and that is safe for a reason worth stating:
 * both callees are pure functions of this package that run before any
 * connection exists, so neither can be carrying a driver message or a `detail`
 * line quoting values. `cause` keeps the original for a server log.
 *
 * `unknown-column` covers both cases on purpose. A malformed identifier and a
 * column this query may not address are the same answer to the caller — that
 * column is not addressable here — and splitting them would put the difference
 * between "you typed it wrong" and "you may not have it" in a payload the
 * caller can read, which is a distinction worth withholding rather than
 * publishing.
 */
export const assertGroupColumn = ({
  allowedColumns,
  column,
}: AssertGroupColumnArgs): void => {
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
