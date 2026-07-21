import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  SortingState,
  TableColumnsState,
} from '@lcabrera/ui/components/Table/Table.types';

export const buildBatchTableSettingsUpdate = <TData>(
  columnsState?: Partial<TableColumnsState<TData>>,
) => {
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
