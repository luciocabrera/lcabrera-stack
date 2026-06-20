import type {
  ColumnOrderState,
  TableColumn,
} from '@/components/Table/Table.types';

type BuildAllOrderedColumnsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly columnsOrder: ColumnOrderState;
};

/**
 * Builds the complete ordered column list.
 * Uses columnOrder if available, otherwise uses column definition order.
 * Appends any columns not present in columnOrder at the end.
 */
export const buildAllOrderedColumns = <TData>({
  columns,
  columnsOrder,
}: BuildAllOrderedColumnsArgs<TData>): TableColumn<TData>[] => {
  const orderedColumns =
    columnsOrder.length > 0
      ? columnsOrder
          .map((key) => columns.find((col) => col.key === key))
          .filter((col): col is TableColumn<TData> => col !== undefined)
      : columns;

  const remainingColumns = columns.filter((col) =>
    orderedColumns.every((orderedCol) => orderedCol.key !== col.key),
  );

  return [...orderedColumns, ...remainingColumns];
};
