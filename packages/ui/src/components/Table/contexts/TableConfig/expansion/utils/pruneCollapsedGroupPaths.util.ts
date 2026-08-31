import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type PruneCollapsedGroupPathsArgs<TData> = {
  readonly data: readonly TData[];
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const pruneCollapsedGroupPaths = <
  TData extends Record<string, unknown>,
>({
  data,
  toggledGroupPaths,
}: PruneCollapsedGroupPathsArgs<TData>): ReadonlySet<string> => {
  if (toggledGroupPaths.size === 0) return toggledGroupPaths;

  const present = new Set<string>();

  for (const row of data) {
    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) present.add(resolveGroupPathKey(summary.path));
  }

  const kept = [...toggledGroupPaths].filter((pathKey) => present.has(pathKey));

  return kept.length === toggledGroupPaths.size
    ? toggledGroupPaths
    : new Set(kept);
};
