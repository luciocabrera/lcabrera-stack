import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useBatchSetTableSettings } from '@/components/Table/contexts/TableConfig/columns/actions';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

// type BatchTableSettingsUpdate<TData> = {
//   columnFilters: ColumnFiltersState;
//   columnOrder: ColumnOrderState;
//   columnPinning: ColumnPinningState;
//   columnSizing: ColumnSizingState;
//   columnVisibility: ColumnVisibilityState;
//   sorting: SortingState;
// };

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

    batchSetTableSettings({
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
