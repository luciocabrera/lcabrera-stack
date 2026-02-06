import type { TableColumnsState } from '@/components/Table/Table.types';

import {
  getEffectiveColumns,
  getNormalizedColummns,
} from '@/components/Table/utils';

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
