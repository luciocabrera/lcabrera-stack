import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@/components/Table/Table.types';

type RecalculatePinSidesArgs = {
  columnPinning: ColumnPinningState;
  newOrder: ColumnOrderState;
};

/**
 * Recalculates pin sides for pinned columns based on their new position.
 * Each pinned column is assigned to the closest edge (left or right).
 * If equidistant from both edges, the original side is preserved.
 */
export const recalculatePinSides = ({
  columnPinning,
  newOrder,
}: RecalculatePinSidesArgs): ColumnPinningState => {
  const newLeft: string[] = [];
  const newRight: string[] = [];

  const allPinned = [
    ...columnPinning.left.map((key) => ({ key, originalSide: 'left' as const })),
    ...columnPinning.right.map((key) => ({ key, originalSide: 'right' as const })),
  ];

  for (const { key, originalSide } of allPinned) {
    const index = newOrder.indexOf(key);
    if (index === -1) continue;

    const distanceFromLeft = index;
    const distanceFromRight = newOrder.length - 1 - index;

    if (distanceFromLeft < distanceFromRight) {
      newLeft.push(key);
    } else if (distanceFromRight < distanceFromLeft) {
      newRight.push(key);
    } else {
      // Equidistant — keep original side
      if (originalSide === 'left') {
        newLeft.push(key);
      } else {
        newRight.push(key);
      }
    }
  }

  // Preserve order: sort by position in newOrder
  const orderIndex = new Map(newOrder.map((key, i) => [key, i]));
  const sortByOrder = (keys: string[]) =>
    // eslint-disable-next-line local-rules/destructuring-for-functions
    keys.toSorted((a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0));

  return {
    left: sortByOrder(newLeft),
    right: sortByOrder(newRight),
  };
};
