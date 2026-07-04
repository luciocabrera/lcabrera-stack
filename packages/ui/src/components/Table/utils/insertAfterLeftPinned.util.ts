import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@repo/ui/components/Table/Table.types';

type InsertAfterLeftPinnedArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly orderWithoutColumn: readonly DataKey<TData>[];
};

export const insertAfterLeftPinned = <TData>({
  columnKey,
  newPinning,
  orderWithoutColumn,
}: InsertAfterLeftPinnedArgs<TData>): ColumnOrderState<TData> => {
  let lastLeftPinnedIndex = -1;
  for (const [index, key] of orderWithoutColumn.entries()) {
    if (newPinning.left.includes(key)) {
      lastLeftPinnedIndex = index;
    }
  }

  return [
    ...orderWithoutColumn.slice(0, lastLeftPinnedIndex + 1),
    columnKey,
    ...orderWithoutColumn.slice(lastLeftPinnedIndex + 1),
  ] as ColumnOrderState<TData>;
};
