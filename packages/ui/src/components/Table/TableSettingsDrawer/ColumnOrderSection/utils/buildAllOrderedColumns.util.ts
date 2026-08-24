import type {
  ColumnOrderState,
  TableColumn,
} from '#ui/components/Table/Table.types';

type BuildAllOrderedColumnsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly columnsOrder: ColumnOrderState;
};

export const buildAllOrderedColumns = <TData>({
  columns,
  columnsOrder,
}: BuildAllOrderedColumnsArgs<TData>) => {
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
