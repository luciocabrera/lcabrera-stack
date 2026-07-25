type BuildKeysetComparisonArgs = {
  readonly direction: 'asc' | 'desc';
  /** Whether the cursor value for this column is null. */
  readonly isNullValue: boolean;
  /** The already-allocated placeholder for the cursor value, e.g. `$3`. */
  readonly placeholder: string;
  readonly quotedColumn: string;
};

/**
 * The "sorts strictly after the cursor" half of one keyset branch, for a single
 * column, following Postgres's DEFAULT null placement — `ASC` ⇒ NULLS LAST,
 * `DESC` ⇒ NULLS FIRST. A plain `col > $n` is not enough: it evaluates to NULL,
 * not true, for a row whose value is null, so a scroll over any nullable sort
 * column would silently stop at the first such row.
 *
 * `undefined` means nothing can sort after this value in this direction (a null
 * under `ASC` is already last). The caller drops that branch rather than
 * emitting it as a false constant.
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
