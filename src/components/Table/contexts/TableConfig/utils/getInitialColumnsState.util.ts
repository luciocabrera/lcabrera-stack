import type {
  ColumnFiltersState,
  ColumnSizingState,
  TableColumnsState,
} from '@/components/Table/Table.types';

import {
  getEffectiveColumns,
  getNormalizedColummns,
} from '@/components/Table/utils';

type GetInitialTableStateArgs<TData> = Partial<TableColumnsState<TData>>;

export const getInitialColumnsState = <TData>({
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<string>(),
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
  });

  const normalizedColumns = getNormalizedColummns<TData>({
    columns,
    sorting,
  });

  return {
    columnFilters,
    columnOrder,
    columnPinning,
    columns,
    columnSizing,
    columnVisibility,
    effectiveColumns,
    normalizedColumns,
    sorting,
  };
};
