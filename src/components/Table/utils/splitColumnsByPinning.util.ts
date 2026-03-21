import type {
  ColumnPinningState,
  ColumnSizingState,
  TableColumn,
} from '@/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';

/** Column groups produced by splitColumnsByPinning. */
export type SplitColumnsByPinningResult<TData> = {
  /** Widths (px) for each center column, matching the centerCols order. */
  readonly centerColumnWidths: readonly number[];
  /** Non-pinned columns in their display order. */
  readonly centerCols: readonly TableColumn<TData>[];
  /** Left-pinned columns in their display order. */
  readonly leftPinnedCols: readonly TableColumn<TData>[];
  /** Right-pinned columns in their display order. */
  readonly rightPinnedCols: readonly TableColumn<TData>[];
};

type SplitColumnsByPinningArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly effectiveColumns: readonly TableColumn<TData>[];
};

/**
 * Splits `effectiveColumns` into left-pinned, center (non-pinned), and
 * right-pinned groups, and computes the pixel width for each center column.
 *
 * This is used by both `TableHeader` and `TableBody` to prepare input for
 * `useColumnVirtualization`.
 */
export const splitColumnsByPinning = <TData = Record<string, unknown>>({
  columnPinning,
  columnSizing,
  effectiveColumns,
}: SplitColumnsByPinningArgs<TData>): SplitColumnsByPinningResult<TData> => {
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

  const centerColumnWidths = centerCols.map(
    (col) => columnSizing[col.key] ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
  );

  return { centerColumnWidths, centerCols, leftPinnedCols, rightPinnedCols };
};
