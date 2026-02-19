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
// TODO: we should initialize the columnFiltersState based on the columns prop,
// to avoid having filtersData with keys that don't correspond to any column, and to avoid having an empty filtersData
//  when there are columns with default filters defined. The same applies to columnSizingState.

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
