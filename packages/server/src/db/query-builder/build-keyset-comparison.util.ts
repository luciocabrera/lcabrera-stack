type BuildKeysetComparisonArgs = {
  readonly direction: 'asc' | 'desc';
  readonly isNullValue: boolean;
  readonly placeholder: string;
  readonly quotedColumn: string;
};

/**
 * The "sorts strictly after the cursor" half of one keyset branch, for a single column,
 * following Postgres's DEFAULT null placement — `ASC` ⇒ NULLS LAST, `DESC` ⇒ NULLS FIRST.
 * A plain `col > $n` is not enough: it evaluates to NULL, not true, for a row whose value
 * is null, so a scroll over any nullable sort column would silently stop at the first such
 * row.
 */
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
