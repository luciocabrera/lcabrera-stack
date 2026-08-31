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
