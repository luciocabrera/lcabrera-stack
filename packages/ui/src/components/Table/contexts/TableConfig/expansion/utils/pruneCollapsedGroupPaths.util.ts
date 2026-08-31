import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type PruneCollapsedGroupPathsArgs<TData> = {
  readonly data: readonly TData[];
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/**
 * A collapse is remembered by path so it can be re-applied after a refetch that preserves
 * it (ADR-061); a path the new result no longer contains has nothing left to hide, and
 * keeping it would silently re-collapse the group if a later filter brought it back — a
 * state the user last set on data that no longer exists.
 * The **same set instance** comes back when nothing was dropped, so the caller can tell
 * "no change" by identity and never writes a store it did not need to.
 */
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
