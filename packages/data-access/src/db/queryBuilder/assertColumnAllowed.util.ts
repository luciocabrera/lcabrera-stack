type AssertColumnAllowedArgs = {
  readonly allowedColumns?: readonly string[];
  readonly column: string;
};

/**
 * Optional authorization check: a no-op when `allowedColumns` is omitted
 * (today's default for developer-hardcoded columns). The moment a caller
 * lets a column name come from end-user input, it must pass
 * `allowedColumns` so this actually enforces something — assertSafeIdentifier
 * alone only rejects malformed strings, not unintended-but-valid columns.
 */
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
