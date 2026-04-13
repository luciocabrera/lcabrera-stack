import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook.ts';

export const useResetTableSettings = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      columnFilters: columnsState?.columnFilters ?? ({} as ColumnFiltersState),
      columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState),
      columnPinning:
        columnsState?.columnPinning ??
        ({ left: [], right: [] } as ColumnPinningState),
      columnSizing: columnsState?.columnSizing ?? ({} as ColumnSizingState),
      columnVisibility:
        columnsState?.columnVisibility ?? ({} as ColumnVisibilityState),
      sorting: columnsState?.sorting ?? ([] as SortingState),
    });
  };
};
