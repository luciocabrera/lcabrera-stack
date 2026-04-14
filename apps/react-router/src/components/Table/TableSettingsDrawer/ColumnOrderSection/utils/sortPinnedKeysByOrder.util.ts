import type { ColumnOrderState } from '@/components/Table/Table.types';

type SortPinnedKeysByOrderArgs = {
  readonly keys: readonly string[];
  readonly newOrder: ColumnOrderState;
};

export const sortPinnedKeysByOrder = ({
  keys,
  newOrder,
}: SortPinnedKeysByOrderArgs): string[] => {
  const orderIndex = new Map(newOrder.map((key, i) => [key, i]));

  return [...keys].toSorted(
    // eslint-disable-next-line local-rules/destructuring-for-functions
    (a, b) =>
      (orderIndex.get(a) ?? Number.POSITIVE_INFINITY) -
      (orderIndex.get(b) ?? Number.POSITIVE_INFINITY),
  );
};
