import type { ColumnPinningState } from '@/components/Table/Table.types';

type InsertAdjacentToPinnedGroupArgs = {
  columnKey: string;
  columnPinning: ColumnPinningState;
  order: string[];
  side: 'left' | 'right';
};

/**
 * Inserts a column adjacent to the pinned group on the given side.
 * - For 'left': inserts after the last left-pinned column.
 * - For 'right': inserts before the first right-pinned column.
 * Returns the new order array (mutates in place for efficiency).
 */
export const insertAdjacentToPinnedGroup = ({
  columnKey,
  columnPinning,
  order,
  side,
}: InsertAdjacentToPinnedGroupArgs): string[] => {
  if (side === 'left') {
    let lastLeftPinnedIndex = -1;
    for (const [i, key] of order.entries()) {
      if (columnPinning.left.includes(key)) {
        lastLeftPinnedIndex = i;
      }
    }
    order.splice(lastLeftPinnedIndex + 1, 0, columnKey);
  } else {
    const firstRightPinnedIndex = order.findIndex((key) =>
      columnPinning.right.includes(key),
    );
    const insertAt =
      firstRightPinnedIndex === -1 ? order.length : firstRightPinnedIndex;
    order.splice(insertAt, 0, columnKey);
  }

  return order;
};
