import type { ColumnOrderState } from '@/components/Table/Table.types';

type RestoreStaticColumnOrderArgs = {
  currentOrder: ColumnOrderState;
  newOrder: ColumnOrderState;
  staticKeys: Set<string>;
};

/**
 * Restores static columns to their original positions within a reordered column list.
 * Removes static keys from the new order, then re-inserts them at their original indices.
 */
export const restoreStaticColumnOrder = ({
  currentOrder,
  newOrder,
  staticKeys,
}: RestoreStaticColumnOrderArgs): ColumnOrderState => {
  if (staticKeys.size === 0 || currentOrder.length === 0) {
    return newOrder;
  }

  const withoutStatic = newOrder.filter((key) => !staticKeys.has(key));
  const staticPositions = currentOrder
    .map((key, index) => (staticKeys.has(key) ? { index, key } : undefined))
    .filter((entry) => entry !== undefined);

  for (const { index, key } of staticPositions) {
    withoutStatic.splice(index, 0, key);
  }

  return withoutStatic as ColumnOrderState;
};
