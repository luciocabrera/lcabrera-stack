import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@lcabrera/ui/components/Table/Table.types';

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
  const firstRightPinnedIndex = orderWithoutColumn.findIndex((key) =>
    newPinning.right.includes(key),
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
