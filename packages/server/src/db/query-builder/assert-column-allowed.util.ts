type AssertColumnAllowedArgs = {
  readonly allowedColumns?: readonly string[];
  readonly column: string;
};

export const assertColumnAllowed = ({
  allowedColumns,
  column,
}: AssertColumnAllowedArgs): void => {
  if (allowedColumns === undefined) {
    return;
  }

  if (!allowedColumns.includes(column)) {
    throw new Error(
      `Column "${column}" is not in the allowed list for this query.`,
    );
  }
};
