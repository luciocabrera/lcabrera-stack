import type {
  ColumnOrderState,
  ColumnVisibilityState,
  TableColumn,
} from '@/components/Table/Table.types';

type GetEffectiveColumnsArgs<TData> = {
  columnOrder?: ColumnOrderState<TData>;
  columns: TableColumn<TData>[];
  columnVisibility?: ColumnVisibilityState<TData>;
};

export const getEffectiveColumns = <TData>({
  columnOrder,
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
      ? [
          ...columnOrder
            .map((key) => visibleColumns.find((col) => col.key === key))
            .filter((col): col is NonNullable<typeof col> => col !== undefined),
          ...visibleColumns.filter((col) => !columnOrder.includes(col.key)),
        ]
      : visibleColumns;
  return orderedColumns;
};
