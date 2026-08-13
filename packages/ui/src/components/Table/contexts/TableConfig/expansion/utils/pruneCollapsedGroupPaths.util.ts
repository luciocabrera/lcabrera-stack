import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type PruneCollapsedGroupPathsArgs<TData> = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly data: readonly TData[];
};

/**
 * The collapsed paths that still name a group in the rows just loaded.
 *
 * A collapse is remembered by path so it can be re-applied after a refetch that
 * preserves it (ADR-061); a path the new result no longer contains has nothing
 * left to hide, and keeping it would silently re-collapse the group if a later
 * filter brought it back — a state the user last set on data that no longer
 * exists. Dropping it is what makes "re-applied by path" mean the path and not
 * the string.
 *
 * The **same set instance** comes back when nothing was dropped, so the caller
 * can tell "no change" by identity and never writes a store it did not need to.
 */
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
