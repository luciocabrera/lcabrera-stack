import type { ColumnOrderState } from '#ui/components/Table/Table.types';

type SortPinnedKeysByOrderArgs = {
  readonly keys: readonly string[];
  readonly newOrder: ColumnOrderState;
};

export const sortPinnedKeysByOrder = ({
  keys,
  newOrder,
}: SortPinnedKeysByOrderArgs) => {
  const orderIndex = new Map(newOrder.map((key, i) => [key, i]));

  return [...keys].toSorted(
    (a, b) => (orderIndex.get(a) ?? Infinity) - (orderIndex.get(b) ?? Infinity),
  );
};
