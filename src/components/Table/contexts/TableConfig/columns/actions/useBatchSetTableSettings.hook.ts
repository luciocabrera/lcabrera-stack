import { useCallback } from 'react';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  getEffectiveColumns,
  getNormalizedColummns,
} from '@/components/Table/utils';

export type BatchTableSettingsUpdate<TData> = {
  columnFilters: ColumnFiltersState<TData>;
  columnOrder: ColumnOrderState<TData>;
  columnSizing: ColumnSizingState<TData>;
  columnVisibility: ColumnVisibilityState<TData>;
  sorting: SortingState<TData>;
};

export const useBatchSetTableSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();
  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(
    (settings: BatchTableSettingsUpdate<TData>) => {
      const effectiveColumns = getEffectiveColumns({
        columnOrder: settings.columnOrder,
        columns: columnsState?.columns ?? [],
        columnVisibility: settings.columnVisibility,
      });

      const normalizedColumns = getNormalizedColummns({
        columns: columnsState?.columns ?? [],
        sorting: settings.sorting,
      });

      persistTableState([
        {
          persistenceKey,
          searchParamKey: 'filters',
          searchParamValue:
            Object.keys(settings.columnFilters).length > 0
              ? JSON.stringify(settings.columnFilters)
              : undefined,
          slice: 'columnFilters',
          valueSlice: settings.columnFilters,
        },
        {
          persistenceKey,
          searchParamKey: 'sort',
          searchParamValue:
            Object.keys(settings.sorting).length > 0
              ? JSON.stringify(settings.sorting)
              : undefined,
          slice: 'sorting',
          valueSlice: settings.sorting,
        },
        {
          persistenceKey,
          slice: 'columnOrder',
          valueSlice: settings.columnOrder,
        },
        {
          persistenceKey,
          slice: 'columnSizing',
          valueSlice: settings.columnSizing,
        },
        {
          persistenceKey,
          slice: 'columnVisibility',
          valueSlice: settings.columnVisibility,
        },
      ]);

      columnsStore.set({ ...settings, effectiveColumns, normalizedColumns });
    },
    [columnsStore, columnsState, persistTableState, persistenceKey],
  );
};
