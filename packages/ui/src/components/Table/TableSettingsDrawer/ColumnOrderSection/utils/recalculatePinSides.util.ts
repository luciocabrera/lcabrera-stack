import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';

import { getPinnedEntries } from './getPinnedEntries.util';
import { resolveClosestSide } from './resolveClosestSide.util';
import { sortPinnedKeysByOrder } from './sortPinnedKeysByOrder.util';

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
}: RecalculatePinSidesArgs) => {
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
