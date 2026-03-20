import type {
  ColumnFiltersState,
  ColumnSizingState,
  DataKey,
  TableColumnsState,
} from '@/components/Table/Table.types';

import {
  getEffectiveColumns,
  getNormalizedColumns,
  getStaticColumnKeys,
} from '@/components/Table/utils';

type GetInitialTableStateArgs<TData> = Partial<TableColumnsState<TData>>;

export const getInitialColumnsState = <TData>({
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<DataKey<TData>>(),
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
  });

  const normalizedColumns = getNormalizedColumns<TData>({
    columns,
    sorting,
  });

  const staticKeys = getStaticColumnKeys<TData>(columns);

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
    staticKeys,
  };
};
