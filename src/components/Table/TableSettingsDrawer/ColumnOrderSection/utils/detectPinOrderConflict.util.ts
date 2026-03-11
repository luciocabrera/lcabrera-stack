import type { ColumnOrderState, ColumnPinningState } from '@/components/Table/Table.types';

type DetectPinOrderConflictArgs = {
  columnPinning: ColumnPinningState;
  newOrder: ColumnOrderState;
};

/**
 * Detects whether a new column order conflicts with the current pinning state.
 * Left-pinned columns must appear at the start of the order (contiguous),
 * and right-pinned columns must appear at the end (contiguous).
 */
export const detectPinOrderConflict = ({
  columnPinning,
  newOrder,
}: DetectPinOrderConflictArgs): boolean => {
  const { left, right } = columnPinning;

  if (left.length === 0 && right.length === 0) return false;

  // Check left-pinned: all must be in the first N positions
  if (left.length > 0) {
    const leftPositions = left.map((key) => newOrder.indexOf(key));
    const maxLeftPos = Math.max(...leftPositions);
    if (maxLeftPos >= left.length) return true;
  }

  // Check right-pinned: all must be in the last N positions
  if (right.length > 0) {
    const rightPositions = right.map((key) => newOrder.indexOf(key));
    const minRightPos = Math.min(...rightPositions);
    if (minRightPos < newOrder.length - right.length) return true;
  }

  return false;
};
