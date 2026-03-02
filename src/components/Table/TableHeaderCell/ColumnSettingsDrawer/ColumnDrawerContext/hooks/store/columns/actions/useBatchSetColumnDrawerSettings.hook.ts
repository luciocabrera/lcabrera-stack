import type {
  ColumnFiltersState,
  ColumnSizingState,
} from '@/components/Table/Table.types';

import { useBatchSetColumnSettings } from '@/components/Table/contexts/TableConfig/columns/actions';

import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

// type BatchTableSettingsUpdate<TData> = {
//   columnFilters: ColumnFiltersState;
//   columnOrder: ColumnOrderState;
//   columnSizing: ColumnSizingState;
//   columnVisibility: ColumnVisibilityState;
//   sorting: SortingState;
// };

/**
 * Hook to batch update all table settings at once
 * This prevents intermediate state updates that could trigger effects
 * between individual setter calls
 */
export const useBatchSetColumnDrawerSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();

  const batchSetColumnSettings = useBatchSetColumnSettings();

  return () => {
    const columnsState = columnStore.get();
    console.log('[useBatchSetColumnDrawerSettings] Before:', {
      columnFilters:
        columnsState?.columnFilters ?? ({} as ColumnFiltersState<unknown>),
      columnSizing:
        columnsState?.columnSizing ?? ({} as ColumnSizingState<unknown>),
      sorting: columnsState?.sorting,
    });

    batchSetColumnSettings({
      columnFilters: columnsState?.columnFilters,
      columnSizing: columnsState?.columnSizing,
      sorting: columnsState?.sorting,
    });
  };
};
