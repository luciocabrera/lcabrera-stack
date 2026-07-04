import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { getDefaultColumnPinning } from './getDefaultColumnPinning.util';

/**
 * Hook to clear all table settings to empty defaults
 */
export const useClearAllSettings = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    const defaultPinning = getDefaultColumnPinning(
      tableColumnsStore.get()?.columnPinning,
    );

    columnsStore.set({
      columnFilters: {} as ColumnFiltersState,
      columnOrder: [] as ColumnOrderState,
      columnPinning: defaultPinning,
      columnSizing: {} as ColumnSizingState,
      columnVisibility: new Set() as ColumnVisibilityState,
      sorting: [] as SortingState,
    });
  };
};
