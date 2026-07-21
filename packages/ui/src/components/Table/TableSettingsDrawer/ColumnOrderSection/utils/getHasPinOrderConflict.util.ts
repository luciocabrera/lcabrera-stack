import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@lcabrera/ui/components/Table/Table.types';

type GetHasPinOrderConflictArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly newOrder: ColumnOrderState<TData>;
  readonly staticKeys?: Set<string>;
};

/**
 * Detects whether a new column order conflicts with the current pinning state.
 * Left-pinned columns must appear at the start of the order (contiguous),
 * and right-pinned columns must appear at the end (contiguous).
 * Static columns are excluded from conflict detection.
 */
export const getHasPinOrderConflict = <TData>({
  columnPinning,
  newOrder,
  staticKeys,
}: GetHasPinOrderConflictArgs<TData>) => {
  const left = staticKeys
    ? columnPinning.left.filter((key) => !staticKeys.has(key))
    : columnPinning.left;
  const right = staticKeys
    ? columnPinning.right.filter((key) => !staticKeys.has(key))
    : columnPinning.right;
  const filteredOrder = staticKeys
    ? (newOrder.filter(
        (key) => !staticKeys.has(key),
      ) as ColumnOrderState<TData>)
    : newOrder;

  // Check left-pinned: all must be in the first N positions
  if (left.length > 0) {
    const leftPositions = left.map((key) => filteredOrder.indexOf(key));
    const maxLeftPos = Math.max(...leftPositions);
    if (maxLeftPos >= left.length) return true;
  }

  // Check right-pinned: all must be in the last N positions
  if (right.length > 0) {
    const rightPositions = right.map((key) => filteredOrder.indexOf(key));
    const minRightPos = Math.min(...rightPositions);
    if (minRightPos < filteredOrder.length - right.length) return true;
  }

  return false;
};
