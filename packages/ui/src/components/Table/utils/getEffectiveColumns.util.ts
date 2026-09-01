import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { orderColumnsByKeys } from './orderColumnsByKeys.util';
import { splitColumnsByPinning } from './splitColumnsByPinning.util';

type GetEffectiveColumnsArgs<TData> = {
  readonly columnOrder?: ColumnOrderState<TData>;
  readonly columnPinning?: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility?: ColumnVisibilityState<TData>;
};

export const getEffectiveColumns = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
}: GetEffectiveColumnsArgs<TData>) => {
  const visibleColumns = columns.filter(
    (col) => !(columnVisibility?.has(col.key) ?? false),
  );

  const orderedColumns =
    columnOrder && columnOrder.length > 0
      ? orderColumnsByKeys<TData>({ columnOrder, columns: visibleColumns })
      : visibleColumns;

  if (!columnPinning) return orderedColumns;

  const leftPinned = columnPinning.left ?? [];
  const rightPinned = columnPinning.right ?? [];

  if (leftPinned.length === 0 && rightPinned.length === 0)
    return orderedColumns;

  const { centerCols, leftPinnedCols, rightPinnedCols } =
    splitColumnsByPinning<TData>({
      columnPinning: { left: leftPinned, right: rightPinned },
      effectiveColumns: orderedColumns,
    });

  return [...leftPinnedCols, ...centerCols, ...rightPinnedCols];
};
