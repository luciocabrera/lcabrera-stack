import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@lcabrera/ui/components/Table/Table.types';

type InsertAfterLeftPinnedArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly orderWithoutColumn: readonly DataKey<TData>[];
};

export const insertAfterLeftPinned = <TData>({
  columnKey,
  newPinning,
  orderWithoutColumn,
}: InsertAfterLeftPinnedArgs<TData>) => {
  const leftPinned = new Set<string>(newPinning.left);
  const lastLeftPinnedIndex = orderWithoutColumn.findLastIndex((key) =>
    leftPinned.has(key),
  );

  return [
    ...orderWithoutColumn.slice(0, lastLeftPinnedIndex + 1),
    columnKey,
    ...orderWithoutColumn.slice(lastLeftPinnedIndex + 1),
  ] as ColumnOrderState<TData>;
};
