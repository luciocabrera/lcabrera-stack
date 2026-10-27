import { QueryRefusedError } from '../../errors/query-refused.error.ts';

type AssertColumnAllowedArgs = {
  readonly allowedColumns?: readonly string[];
  readonly column: string;
};

export const assertColumnAllowed = ({
  allowedColumns,
  column,
}: AssertColumnAllowedArgs) => {
  if (allowedColumns === undefined) {
    return;
  }

  if (!allowedColumns.includes(column)) {
    throw new QueryRefusedError({
      column,
      message: `Column "${column}" is not in the allowed list for this query.`,
      reason: 'column-not-allowed',
    });
  }
};
