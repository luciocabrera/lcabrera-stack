import type {
  ColumnPinningState,
  DataKey,
} from '@lcabrera/ui/components/Table/Table.types';

type InsertAdjacentToPinnedGroupArgs<TData = Record<string, unknown>> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly order: readonly DataKey<TData>[];
  readonly side: 'left' | 'right';
};

/**
 * Inserts a column adjacent to the pinned group on the given side.
 * - For 'left': inserts after the last left-pinned column.
 * - For 'right': inserts before the first right-pinned column.
 * Returns a new order array without mutating the input.
 */
export const insertAdjacentToPinnedGroup = <TData = Record<string, unknown>>({
  columnKey,
  columnPinning,
  order,
  side,
}: InsertAdjacentToPinnedGroupArgs<TData>) => {
  const nextOrder = [...order];

  if (side === 'left') {
    const leftPinned = new Set<string>(columnPinning.left);
    const lastLeftPinnedIndex = nextOrder.findLastIndex((key) =>
      leftPinned.has(key),
    );

    nextOrder.splice(lastLeftPinnedIndex + 1, 0, columnKey);
  } else {
    const rightPinned = new Set<string>(columnPinning.right);
    const firstRightPinnedIndex = nextOrder.findIndex((key) =>
      rightPinned.has(key),
    );
    const insertAt =
      firstRightPinnedIndex === -1 ? nextOrder.length : firstRightPinnedIndex;
    nextOrder.splice(insertAt, 0, columnKey);
  }

  return nextOrder;
};
