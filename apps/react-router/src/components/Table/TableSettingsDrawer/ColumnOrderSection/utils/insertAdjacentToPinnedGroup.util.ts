import type { ColumnPinningState } from '@/components/Table/Table.types';

type InsertAdjacentToPinnedGroupArgs = {
  readonly columnKey: string;
  readonly columnPinning: ColumnPinningState;
  readonly order: readonly string[];
  readonly side: 'left' | 'right';
};

/**
 * Inserts a column adjacent to the pinned group on the given side.
 * - For 'left': inserts after the last left-pinned column.
 * - For 'right': inserts before the first right-pinned column.
 * Returns a new order array without mutating the input.
 */
export const insertAdjacentToPinnedGroup = ({
  columnKey,
  columnPinning,
  order,
  side,
}: InsertAdjacentToPinnedGroupArgs): string[] => {
  const nextOrder = [...order];

  if (side === 'left') {
    let lastLeftPinnedIndex = -1;
    for (const [i, key] of nextOrder.entries()) {
      if (columnPinning.left.includes(key)) {
        lastLeftPinnedIndex = i;
      }
    }
    nextOrder.splice(lastLeftPinnedIndex + 1, 0, columnKey);
  } else {
    const firstRightPinnedIndex = nextOrder.findIndex((key) =>
      columnPinning.right.includes(key),
    );
    const insertAt =
      firstRightPinnedIndex === -1 ? nextOrder.length : firstRightPinnedIndex;
    nextOrder.splice(insertAt, 0, columnKey);
  }

  return nextOrder;
};
