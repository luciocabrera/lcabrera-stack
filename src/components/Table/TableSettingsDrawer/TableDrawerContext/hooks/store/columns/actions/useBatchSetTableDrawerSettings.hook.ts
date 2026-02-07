import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useBatchSetTableSettings } from '@/components/Table/TableContext/hooks/store/columns/actions';

import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

type BatchTableSettingsUpdate = {
  columnFilters: ColumnFiltersState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: ColumnVisibilityState;
  sorting: SortingState;
};

/**
 * Hook to batch update all table settings at once
 * This prevents intermediate state updates that could trigger effects
 * between individual setter calls
 */
export const useBatchSetTableDrawerSettings = () => {
  const { columnsStore } = useTableDrawerContextValue();

  const batchSetTableSettings = useBatchSetTableSettings();

  return () => {
    const columnsState = columnsStore.get();
        console.log('[useBatchSetTableDrawerSettings] Before:', {

        columnFilters: columnsState?.columnFilters ?? ({} as ColumnFiltersState),
        columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState),
        columnSizing: columnsState?.columnSizing ?? ({} as ColumnSizingState),
        columnVisibility: columnsState?.columnVisibility ?? ({} as ColumnVisibilityState),
        sorting: columnsState?.sorting ?? ([] as SortingState),
      
    });
 
      batchSetTableSettings({
        columnFilters: columnsState?.columnFilters ?? ({} as ColumnFiltersState),
        columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState),
        columnSizing: columnsState?.columnSizing ?? ({} as ColumnSizingState),
        columnVisibility: columnsState?.columnVisibility ?? ({} as ColumnVisibilityState),
        sorting: columnsState?.sorting ?? ([] as SortingState),
      });
      
  };
};
