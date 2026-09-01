type BuildKeysetComparisonArgs = {
  readonly direction: 'asc' | 'desc';
  readonly isNullValue: boolean;
  readonly placeholder: string;
  readonly quotedColumn: string;
};

export const buildKeysetComparison = ({
  direction,
  isNullValue,
  placeholder,
  quotedColumn,
}: BuildKeysetComparisonArgs) => {
  if (direction === 'desc') {
    return isNullValue
      ? `${quotedColumn} IS NOT NULL`
      : `${quotedColumn} < ${placeholder}`;
  }

  return isNullValue
    ? undefined
    : `(${quotedColumn} > ${placeholder} OR ${quotedColumn} IS NULL)`;
};
