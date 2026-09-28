import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { getClearedColumnPinning } from './getClearedColumnPinning.util';

export const useClearAllSettings = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({
      columnFilters: {} as ColumnFiltersState,
      columnOrder: [] as ColumnOrderState,
      columnPinning: getClearedColumnPinning(tableColumnsStore.get()),
      columnSizing: {} as ColumnSizingState,
      columnVisibility: new Set() as ColumnVisibilityState,
      sorting: [] as SortingState,
    });
  };
};
