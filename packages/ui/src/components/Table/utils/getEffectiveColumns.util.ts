import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

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
      ? [
          ...columnOrder
            .map((key) => visibleColumns.find((col) => col.key === key))
            .filter((col): col is NonNullable<typeof col> => col !== undefined),
          ...visibleColumns.filter((col) => !columnOrder.includes(col.key)),
        ]
      : visibleColumns;

  // Apply pinning order: left pinned → unpinned → right pinned
  if (!columnPinning) return orderedColumns;

  const leftPinned = columnPinning.left ?? [];
  const rightPinned = columnPinning.right ?? [];

  if (leftPinned.length === 0 && rightPinned.length === 0)
    return orderedColumns;

  const pinnedLeftCols = orderedColumns.filter((col) =>
    leftPinned.includes(col.key),
  );

  const pinnedRightCols = orderedColumns.filter((col) =>
    rightPinned.includes(col.key),
  );

  const unpinnedCols = orderedColumns.filter(
    (col) => !leftPinned.includes(col.key) && !rightPinned.includes(col.key),
  );

  return [...pinnedLeftCols, ...unpinnedCols, ...pinnedRightCols];
};
