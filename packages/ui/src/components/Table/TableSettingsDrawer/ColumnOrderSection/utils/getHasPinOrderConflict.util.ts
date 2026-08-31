import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';

type GetHasPinOrderConflictArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly newOrder: ColumnOrderState<TData>;
  readonly staticKeys?: Set<string>;
};

export const getHasPinOrderConflict = <TData>({
  columnPinning,
  newOrder,
  staticKeys,
}: GetHasPinOrderConflictArgs<TData>) => {
  const left = staticKeys
    ? columnPinning.left.filter((key) => !staticKeys.has(key))
    : columnPinning.left;
  const right = staticKeys
    ? columnPinning.right.filter((key) => !staticKeys.has(key))
    : columnPinning.right;
  const filteredOrder = staticKeys
    ? (newOrder.filter(
        (key) => !staticKeys.has(key),
      ) as ColumnOrderState<TData>)
    : newOrder;

  if (left.length > 0) {
    const leftPositions = left.map((key) => filteredOrder.indexOf(key));
    const maxLeftPos = Math.max(...leftPositions);
    if (maxLeftPos >= left.length) return true;
  }

  if (right.length > 0) {
    const rightPositions = right.map((key) => filteredOrder.indexOf(key));
    const minRightPos = Math.min(...rightPositions);
    if (minRightPos < filteredOrder.length - right.length) return true;
  }

  return false;
};
