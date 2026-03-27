import type { ColumnOrderState, ColumnPinningState } from "@/components/Table/Table.types";

type RecalculatePinSidesArgs = {
  readonly columnPinning: ColumnPinningState;
  readonly newOrder: ColumnOrderState;
  readonly staticKeys?: Set<string>;
};

/**
 * Recalculates pin sides for pinned columns based on their new position.
 * Each pinned column is assigned to the closest edge (left or right).
 * If equidistant from both edges, the original side is preserved.
 * Static columns are preserved in their original pin side.
 */
export const recalculatePinSides = ({
  columnPinning,
  newOrder,
  staticKeys,
}: RecalculatePinSidesArgs): ColumnPinningState => {
  const newLeft: string[] = [];
  const newRight: string[] = [];

  // Preserve static columns in their original pin side
  if (staticKeys) {
    for (const key of columnPinning.left) {
      if (staticKeys.has(key)) newLeft.push(key);
    }
    for (const key of columnPinning.right) {
      if (staticKeys.has(key)) newRight.push(key);
    }
  }

  const allPinned = [
    ...columnPinning.left.map((key) => ({
      key,
      originalSide: "left" as const,
    })),
    ...columnPinning.right.map((key) => ({
      key,
      originalSide: "right" as const,
    })),
  ];

  for (const { key, originalSide } of allPinned) {
    if (staticKeys?.has(key)) continue;

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
      if (originalSide === "left") {
        newLeft.push(key);
      } else {
        newRight.push(key);
      }
    }
  }

  // Preserve order: sort by position in newOrder
  const orderIndex = new Map(newOrder.map((key, i) => [key, i]));
  const sortByOrder = (keys: string[]) =>
    keys.toSorted(
      // eslint-disable-next-line local-rules/destructuring-for-functions
      (a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0),
    );

  return {
    left: sortByOrder(newLeft),
    right: sortByOrder(newRight),
  };
};
