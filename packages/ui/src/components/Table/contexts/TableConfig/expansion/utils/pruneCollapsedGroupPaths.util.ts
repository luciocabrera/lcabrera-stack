import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type PruneCollapsedGroupPathsArgs<TData> = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly data: readonly TData[];
};

export const pruneCollapsedGroupPaths = <
  TData extends Record<string, unknown>,
>({
  collapsedGroupPaths,
  data,
}: PruneCollapsedGroupPathsArgs<TData>): ReadonlySet<string> => {
  if (collapsedGroupPaths.size === 0) return collapsedGroupPaths;

  const present = new Set<string>();

  for (const row of data) {
    const summary = getTableGroupRowSummary(row);

    if (summary !== undefined) present.add(resolveGroupPathKey(summary.path));
  }

  const kept = [...collapsedGroupPaths].filter((pathKey) =>
    present.has(pathKey),
  );

  return kept.length === collapsedGroupPaths.size
    ? collapsedGroupPaths
    : new Set(kept);
};
