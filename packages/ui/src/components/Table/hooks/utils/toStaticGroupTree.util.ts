import { getTableGroupRowSummary } from '#ui/components/Table/utils/getTableGroupRowSummary.util';

const NO_FOLDABLE_GROUP_PATHS: ReadonlySet<string> = new Set<string>();

export const toStaticGroupTree = <TData extends Record<string, unknown>>(
  data: readonly TData[],
) => ({
  foldableGroupPaths: NO_FOLDABLE_GROUP_PATHS,
  isTreeGrid: data.some((row) => getTableGroupRowSummary(row) !== undefined),
  rowMeta: undefined,
  rows: data,
});
