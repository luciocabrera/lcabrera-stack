import { buildKeysetComparison } from './build-keyset-comparison.util.ts';

export type KeysetSortEntry = {
  readonly direction: 'asc' | 'desc';
  readonly isNullValue: boolean;
  readonly placeholder: string;
  readonly quotedColumn: string;
};

type BuildKeysetBranchArgs = {
  readonly entries: readonly KeysetSortEntry[];
  readonly index: number;
};

/**
 * One OR-branch of the lexicographic keyset predicate: every earlier sort column
 * pinned to equality, the column at `index` advanced past the cursor.
 *
 * Equality is `IS NOT DISTINCT FROM`, not `=`, so a null cursor value ties with
 * a null column value instead of collapsing the whole branch to NULL.
 *
 * `undefined` when nothing can sort after the value at `index` — the branch is
 * unsatisfiable and the caller drops it.
 */
export const buildKeysetBranch = ({
  entries,
  index,
}: BuildKeysetBranchArgs) => {
  const entry = entries[index];

  if (entry === undefined) {
    return;
  }

  const comparison = buildKeysetComparison(entry);

  if (comparison === undefined) {
    return;
  }

  const equalities = entries
    .slice(0, index)
    .map(
      ({ placeholder, quotedColumn }) =>
        `${quotedColumn} IS NOT DISTINCT FROM ${placeholder}`,
    );

  return [...equalities, comparison].join(' AND ');
};
