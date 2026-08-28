import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

type CollectGroupLevelFoldPathsArgs<TData> = {
  readonly columnKey: string;
  readonly data: readonly TData[];
  readonly foldableGroupPaths: ReadonlySet<string>;
  readonly groupingKeys: readonly string[];
};

const NO_PATHS: ReadonlySet<string> = new Set<string>();

/**
 * The groups whose fold takes away the values one column states — the level **above** it,
 * because a collapse hides a group's descendants and never its own row (ADR-067).
 * Narrowed by `foldableGroupPaths` rather than derived from the key list alone, which is
 * what carries ADR-083 here: a level with no row of its own never enters that set, so the
 * outermost key answers the empty set and the action is never offered where the fold would
 * leave nothing to undo it. That is the same rule the chevrons are drawn from, stated once
 * rather than re-spelled as an index check.
 */
export const collectGroupLevelFoldPaths = <
  TData extends Record<string, unknown>,
>({
  columnKey,
  data,
  foldableGroupPaths,
  groupingKeys,
}: CollectGroupLevelFoldPathsArgs<TData>): ReadonlySet<string> => {
  const depth = groupingKeys.indexOf(columnKey);

  // A column that is not an applied key states no level, so it folds nothing.
  // Guarded before the slice below, where `indexOf`'s miss would quietly mean
  // "every entry but the last" instead of "no level at all".
  if (depth === -1) return NO_PATHS;

  const paths = new Set<string>();

  for (const row of data) {
    const summary = getTableGroupRowSummary(row);

    // A row shallower than this level sits outside it — under a rollup that is
    // every subtotal above it — and slicing its path would name a *different*,
    // shallower group that this action must not fold.
    if (summary === undefined || summary.path.length < depth) continue;

    const levelKey = resolveGroupPathKey(summary.path.slice(0, depth));

    if (foldableGroupPaths.has(levelKey)) paths.add(levelKey);
  }

  return paths;
};
