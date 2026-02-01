import type { TableColumnsState } from '@/components/Table/Table.types';

import { getEffectiveColumns } from './getEffectiveColumns.util';

type GetInitialTableStateArgs<TData> = Partial<TableColumnsState<TData>>;

export const getInitialColumnsState = <TData>({
  columnFilters = {},
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {},
  columnVisibility = new Set<string>(),
  sorting = [],
}: GetInitialTableStateArgs<TData>): TableColumnsState<TData> => {
  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder,
    columns,
    columnVisibility,
  });

  return {
    columnFilters,
    columnOrder,
    columnPinning,
    columns,
    columnSizing,
    columnVisibility,
    effectiveColumns,
    sorting,
  };
};
