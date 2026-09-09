import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

type SanitizeLayoutByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

export const sanitizeLayoutByColumns = <TData extends Record<string, unknown>>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  sorting,
}: SanitizeLayoutByColumnsArgs<TData>) => {
  const declaredKeys = new Set(columns.map((column) => String(column.key)));

  return {
    columnOrder: columnOrder.filter((key) =>
      declaredKeys.has(String(key)),
    ) as ColumnOrderState<TData>,
    columnPinning: {
      left: columnPinning.left.filter((key) => declaredKeys.has(String(key))),
      right: columnPinning.right.filter((key) => declaredKeys.has(String(key))),
    } as ColumnPinningState<TData>,
    columnSizing: Object.fromEntries(
      Object.entries(columnSizing).filter(([key]) => declaredKeys.has(key)),
    ) as ColumnSizingState<TData>,
    columnVisibility: new Set(
      [...columnVisibility].filter((key) => declaredKeys.has(String(key))),
    ) as ColumnVisibilityState<TData>,
    sorting: sorting.filter((entry) =>
      declaredKeys.has(String(entry.columnKey)),
    ),
  };
};
