import type {
  ColumnOrderState,
  ColumnPinningState,
} from '@/components/Table/Table.types';

type RecalculatePinSidesArgs = {
  readonly columnPinning: ColumnPinningState;
  readonly newOrder: ColumnOrderState;
  readonly staticKeys?: Set<string>;
};

type PinSide = 'left' | 'right';

type PinnedEntry = {
  readonly key: string;
  readonly originalSide: PinSide;
};

const getPinnedEntries = ({
  columnPinning,
}: {
  readonly columnPinning: ColumnPinningState;
}): readonly PinnedEntry[] => [
  ...columnPinning.left.map((key) => ({ key, originalSide: 'left' as const })),
  ...columnPinning.right.map((key) => ({
    key,
    originalSide: 'right' as const,
  })),
];

const resolveClosestSide = ({
  distanceFromLeft,
  distanceFromRight,
  originalSide,
}: {
  readonly distanceFromLeft: number;
  readonly distanceFromRight: number;
  readonly originalSide: PinSide;
}): PinSide => {
  if (distanceFromLeft < distanceFromRight) {
    return 'left';
  } else if (distanceFromRight < distanceFromLeft) {
    return 'right';
  }

  return originalSide;
};

const sortPinnedKeysByOrder = ({
  keys,
  newOrder,
}: {
  readonly keys: readonly string[];
  readonly newOrder: ColumnOrderState;
}): string[] => {
  const orderIndex = new Map(newOrder.map((key, i) => [key, i]));

  return [...keys].toSorted(
    // eslint-disable-next-line local-rules/destructuring-for-functions
    (a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0),
  );
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
  const pinnedEntries = getPinnedEntries({ columnPinning });

  const staticLeft = columnPinning.left.filter((key) => staticKeys?.has(key));
  const staticRight = columnPinning.right.filter((key) => staticKeys?.has(key));
  const dynamicEntries = pinnedEntries.filter(
    ({ key }) => !staticKeys?.has(key),
  );

  const dynamicPinning = dynamicEntries.reduce(
    (acc, { key, originalSide }) => {
      const index = newOrder.indexOf(key);

      if (index === -1) {
        return acc;
      }

      const side = resolveClosestSide({
        distanceFromLeft: index,
        distanceFromRight: newOrder.length - 1 - index,
        originalSide,
      });

      if (side === 'left') {
        acc.left.push(key);
      } else {
        acc.right.push(key);
      }

      return acc;
    },
    { left: [] as string[], right: [] as string[] },
  );

  const left = sortPinnedKeysByOrder({
    keys: [...staticLeft, ...dynamicPinning.left],
    newOrder,
  });
  const right = sortPinnedKeysByOrder({
    keys: [...staticRight, ...dynamicPinning.right],
    newOrder,
  });

  return {
    left,
    right,
  };
};
