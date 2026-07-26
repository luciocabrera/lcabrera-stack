import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

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
  // Filter visible columns
  const visibleColumns = columns.filter(
    (col) => !(columnVisibility?.has(col.key) ?? false),
  );

  // Apply column order
  const orderedColumns =
    columnOrder && columnOrder.length > 0
      ? orderColumnsByKeys<TData>({ columnOrder, columns: visibleColumns })
      : visibleColumns;

  // Apply pinning order: left pinned → unpinned → right pinned
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
