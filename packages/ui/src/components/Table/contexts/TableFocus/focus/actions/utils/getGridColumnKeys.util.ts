import type { PinnedColumnPartitionState } from '#ui/components/Table/Table.types';

/**
 * It reads the pinned partition rather than the declared columns because the partition is
 * what the body actually renders — hidden columns are already gone from it and the pinned
 * groups are already in painted order, so the focus sequence and the visual sequence
 * cannot disagree.
 */
export const getGridColumnKeys = <TData extends Record<string, unknown>>({
  centerCols,
  leftPinnedCols,
  rightPinnedCols,
}: PinnedColumnPartitionState<TData>) =>
  [...leftPinnedCols, ...centerCols, ...rightPinnedCols].map(
    (column) => column.key as string,
  );
