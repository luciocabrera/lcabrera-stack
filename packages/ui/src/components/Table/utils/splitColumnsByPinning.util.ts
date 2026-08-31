import type {
  ColumnPinningState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type SplitColumnsByPinningArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly effectiveColumns: readonly TableColumn<TData>[];
};

export const splitColumnsByPinning = <TData = Record<string, unknown>>({
  columnPinning,
  effectiveColumns,
}: SplitColumnsByPinningArgs<TData>) => {
  const leftPinnedSet = new Set<string>(columnPinning.left);
  const rightPinnedSet = new Set<string>(columnPinning.right);

  const leftPinnedCols = effectiveColumns.filter((col) =>
    leftPinnedSet.has(col.key),
  );
  const rightPinnedCols = effectiveColumns.filter((col) =>
    rightPinnedSet.has(col.key),
  );
  const centerCols = effectiveColumns.filter(
    (col) => !leftPinnedSet.has(col.key) && !rightPinnedSet.has(col.key),
  );

  return { centerCols, leftPinnedCols, rightPinnedCols };
};
