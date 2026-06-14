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
import { deriveColumnViewState } from '@/components/Table/utils';

import { buildPersistencePayload } from './utils';

type BatchTableSettingsUpdate<TData> = {
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

    const {
      columnGroups,
      effectiveColumns,
      normalizedColumns,
      pinnedColumnOffsets,
    } = deriveColumnViewState<TData>({
      columnOrder: settings.columnOrder,
      columnPinning: settings.columnPinning,
      columnSizing: settings.columnSizing,
      columns: columnsState?.columns ?? [],
      columnVisibility: settings.columnVisibility,
      sorting: settings.sorting,
    });

    persistTableState(
      buildPersistencePayload<TData>({
        columnFilters: settings.columnFilters,
        columnOrder: settings.columnOrder,
        columnPinning: settings.columnPinning,
        columnSizing: settings.columnSizing,
        columnVisibility: settings.columnVisibility,
        persistenceKey,
        sorting: settings.sorting,
      }),
    );

    columnsStore.set({
      ...settings,
      columnGroups,
      effectiveColumns,
      normalizedColumns,
      pinnedColumnOffsets,
    });
    metaStore.set({ isTableSettingsOpen: false });
    dataStore.set({
      isLoadingMore: false,
    });
  };
};
