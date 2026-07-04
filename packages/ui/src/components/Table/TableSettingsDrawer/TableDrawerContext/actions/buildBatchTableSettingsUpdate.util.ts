import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  SortingState,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';

type BatchTableSettingsUpdate<TData> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

export const buildBatchTableSettingsUpdate = <TData>(
  columnsState?: Partial<TableColumnsState<TData>>,
): BatchTableSettingsUpdate<TData> => {
  return {
    columnFilters:
      columnsState?.columnFilters ?? ({} as ColumnFiltersState<TData>),
    columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>),
    columnPinning:
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>),
    columnSizing:
      columnsState?.columnSizing ?? ({} as ColumnSizingState<TData>),
    columnVisibility:
      columnsState?.columnVisibility ?? new Set<DataKey<TData>>(),
    sorting: columnsState?.sorting ?? ([] as SortingState<TData>),
  };
};
