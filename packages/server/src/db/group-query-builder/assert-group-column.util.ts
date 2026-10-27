import type {
  ColumnReference,
  ReadScope,
} from '../query-builder/query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { QueryRefusedError } from '../../errors/query-refused.error.ts';
import { resolveColumnReference } from '../query-builder/resolve-column-reference.util.ts';
import { toColumnName } from '../query-builder/to-column-name.util.ts';

type AssertGroupColumnArgs = {
  readonly allowedColumns: readonly string[];
  readonly column: ColumnReference;
  readonly scope?: ReadScope;
};

export const assertGroupColumn = ({
  allowedColumns,
  column,
  scope,
}: AssertGroupColumnArgs) => {
  try {
    return resolveColumnReference({ allowedColumns, reference: column, scope });
  } catch (error) {
    if (
      error instanceof QueryRefusedError &&
      error.reason === 'join-source-unknown'
    ) {
      throw error;
    }

    const name = toColumnName(column);

    throw new GroupingRefusedError({
      cause: error,
      column: name,
      message:
        error instanceof Error
          ? error.message
          : `Column "${name}" cannot be used in a grouped query.`,
      reason: 'unknown-column',
    });
  }
};
