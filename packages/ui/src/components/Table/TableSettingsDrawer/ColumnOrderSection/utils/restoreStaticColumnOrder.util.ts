import type { ColumnOrderState } from '#ui/components/Table/Table.types';

type RestoreStaticColumnOrderArgs = {
  readonly currentOrder: ColumnOrderState;
  readonly newOrder: ColumnOrderState;
  readonly staticKeys: Set<string>;
};

export const restoreStaticColumnOrder = ({
  currentOrder,
  newOrder,
  staticKeys,
}: RestoreStaticColumnOrderArgs) => {
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
