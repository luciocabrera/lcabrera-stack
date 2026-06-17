import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

import { insertAfterLeftPinned } from './insertAfterLeftPinned.util';
import { insertBeforeRightPinned } from './insertBeforeRightPinned.util';

type ResolveUnpinnedOrderArgs<TData> = {
  readonly baseOrder: readonly DataKey<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly orderWithoutColumn: readonly DataKey<TData>[];
  readonly previousPinning?: ColumnPinningState<TData>;
};

export const resolveUnpinnedOrder = <TData>({
  baseOrder,
  columnKey,
  newPinning,
  orderWithoutColumn,
  previousPinning,
}: ResolveUnpinnedOrderArgs<TData>): ColumnOrderState<TData> => {
  const wasLeftPinned = previousPinning?.left.includes(columnKey) ?? false;
  const wasRightPinned = previousPinning?.right.includes(columnKey) ?? false;

  if (!wasLeftPinned && !wasRightPinned) {
    return [...baseOrder] as ColumnOrderState<TData>;
  }

  if (wasLeftPinned) {
    return insertAfterLeftPinned<TData>({
      columnKey,
      newPinning,
      orderWithoutColumn,
    });
  }

  return insertBeforeRightPinned<TData>({
    columnKey,
    newPinning,
    orderWithoutColumn,
  });
};
