import type { PinnedColumnPartitionState } from '#ui/components/Table/Table.types';

export const getGridColumnKeys = <TData extends Record<string, unknown>>({
  centerCols,
  leftPinnedCols,
  rightPinnedCols,
}: PinnedColumnPartitionState<TData>) =>
  [...leftPinnedCols, ...centerCols, ...rightPinnedCols].map(
    (column) => column.key as string,
  );
