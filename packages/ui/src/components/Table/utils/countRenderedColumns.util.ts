import type { PinnedColumnPartitionState } from '../Table.types';

export const countRenderedColumns = <TData>({
  centerCols,
  leftPinnedCols,
  rightPinnedCols,
}: PinnedColumnPartitionState<TData>) =>
  leftPinnedCols.length + centerCols.length + rightPinnedCols.length;
