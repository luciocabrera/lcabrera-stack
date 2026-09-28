import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearAllSettings = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({
      columnFilters: {} as ColumnFiltersState,
      columnOrder: [] as ColumnOrderState,
      columnPinning: { left: [], right: [] } as ColumnPinningState,
      columnSizing: {} as ColumnSizingState,
      columnVisibility: new Set() as ColumnVisibilityState,
      sorting: [] as SortingState,
    });
  };
};
