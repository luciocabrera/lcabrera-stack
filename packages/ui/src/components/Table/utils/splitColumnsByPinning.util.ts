import type {
  ColumnPinningState,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

type SplitColumnsByPinningArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly effectiveColumns: readonly TableColumn<TData>[];
};

/**
 * Splits `effectiveColumns` into left-pinned, center (non-pinned), and
 * right-pinned groups, and computes the pixel width for each center column.
 *
 * This is used by both `TableHeader` and `TableBody` to prepare input for
 * the Table's column virtualization.
 */
export const splitColumnsByPinning = <TData = Record<string, unknown>>({
  columnPinning,
  effectiveColumns,
}: SplitColumnsByPinningArgs<TData>) => {
  // Use a Set<string> for O(1) lookup; DataKey<unknown> narrows to 'actions'
  // when TData is unknown, so .includes() on the raw array would not
  // type-check against the broader string keys of effectiveColumns.
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
