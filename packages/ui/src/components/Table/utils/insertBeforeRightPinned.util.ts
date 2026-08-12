import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '#ui/components/Table/Table.types';

type InsertBeforeRightPinnedArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly orderWithoutColumn: readonly DataKey<TData>[];
};

export const insertBeforeRightPinned = <TData>({
  columnKey,
  newPinning,
  orderWithoutColumn,
}: InsertBeforeRightPinnedArgs<TData>) => {
  const rightPinned = new Set<string>(newPinning.right);
  const firstRightPinnedIndex = orderWithoutColumn.findIndex((key) =>
    rightPinned.has(key),
  );
  const insertAt =
    firstRightPinnedIndex === -1
      ? orderWithoutColumn.length
      : firstRightPinnedIndex;

  return [
    ...orderWithoutColumn.slice(0, insertAt),
    columnKey,
    ...orderWithoutColumn.slice(insertAt),
  ] as ColumnOrderState<TData>;
};
