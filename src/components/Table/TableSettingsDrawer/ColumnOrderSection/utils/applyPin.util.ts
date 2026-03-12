import type { ColumnPinningState } from '@/components/Table/Table.types';

type ApplyPinArgs = {
  columnKey: string;
  columnPinning: ColumnPinningState;
  side: 'left' | 'right';
};

/**
 * Creates a new pinning state with the given column added to the specified side.
 * Removes the column from the opposite side if present.
 */
export const applyPin = ({
  columnKey,
  columnPinning,
  side,
}: ApplyPinArgs): ColumnPinningState => {
  const newPinning = {
    left: columnPinning.left.filter((k) => k !== columnKey),
    right: columnPinning.right.filter((k) => k !== columnKey),
  };

  if (side === 'left') {
    newPinning.left = [...newPinning.left, columnKey];
  } else {
    newPinning.right = [...newPinning.right, columnKey];
  }

  return newPinning;
};
