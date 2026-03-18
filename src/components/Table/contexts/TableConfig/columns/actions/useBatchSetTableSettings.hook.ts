import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  getEffectiveColumns,
  getNormalizedColummns,
} from '@/components/Table/utils';
import { serializeFiltersToURL, serializeSortingToURL } from '@/utils/urlState';

export type BatchTableSettingsUpdate<TData> = {
  columnFilters: ColumnFiltersState<TData>;
  columnOrder: ColumnOrderState<TData>;
  columnPinning: ColumnPinningState<TData>;
  columnSizing: ColumnSizingState<TData>;
  columnVisibility: ColumnVisibilityState<TData>;
  sorting: SortingState<TData>;
};

export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchTableSettingsUpdate<TData>) => {
    dataStore.set({
      isLoadingMore: true,
    });
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const effectiveColumns = getEffectiveColumns({
      columnOrder: settings.columnOrder,
      columnPinning: settings.columnPinning,
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
        searchParamValue: serializeFiltersToURL(settings.columnFilters),
        slice: 'columnFilters',
        valueSlice: settings.columnFilters,
      },
      {
        persistenceKey,
        searchParamKey: 'sort',
        searchParamValue: serializeSortingToURL(
          settings.sorting as SortingState,
        ),
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
      {
        persistenceKey,
        slice: 'columnPinning',
        valueSlice: settings.columnPinning,
      },
    ]);

    columnsStore.set({ ...settings, effectiveColumns, normalizedColumns });
    metaStore.set({ isTableSettingsOpen: false });
    dataStore.set({
      isLoadingMore: false,
    });
  };
};
