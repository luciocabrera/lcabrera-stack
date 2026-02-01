import { useSearchParams } from 'react-router';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { getEffectiveColumns } from '@/components/Table/TableContext/utils/getEffectiveColumns.util';
import { writeStateSlice } from '@/components/Table/utils';

export type BatchTableSettingsUpdate = {
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
export const useBatchSetTableSettings = (): ((
  settings: BatchTableSettingsUpdate,
) => void) => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();
  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  const effectiveColumns = getEffectiveColumns({
    columnOrder: columnsState?.columnOrder,
    columns: columnsState?.columns ?? [],
    columnVisibility: columnsState?.columnVisibility,
  });

  return (settings: BatchTableSettingsUpdate) => {
    console.log('[batchSetTableSettings] Before:', {
      currentFilters: columnsState?.columnFilters,
      currentSorting: columnsState?.sorting,
    });
    console.log('[batchSetTableSettings] Setting:', {
      columnFilters: settings.columnFilters,
      sorting: settings.sorting,
    });

    // Persist to falling back storage mechanism (cookie/localStorage)

    const slices: (keyof BatchTableSettingsUpdate)[] = [
      'sorting',
      'columnFilters',
      'columnOrder',
      'columnSizing',
      'columnVisibility',
    ];

    for (const slice of slices) {
      writeStateSlice({
        persistenceKey,
        slice,
        storageType: 'cookie',
        value: settings[slice],
      });
    }

    setSearchParams((params) => {
      if (Object.keys(settings.columnFilters).length > 0) {
        params.set('filters', JSON.stringify(settings.columnFilters));
      } else {
        params.delete('filters');
      }
      if (Object.keys(settings.sorting).length > 0) {
        params.set('sort', JSON.stringify(settings.sorting));
      } else {
        params.delete('sort');
      }
      return params;
    });

    columnsStore.set({ ...settings, effectiveColumns });

    console.log('[batchSetTableSettings] After:', {
      newFilters: columnsStore.get()?.columnFilters,
      newSorting: columnsStore.get()?.sorting,
    });
  };
};
