import type {
  ColumnFiltersState,
  ColumnSizingState,
  ColumnVisibilityState,
} from '@/components/Table/Table.types';
import type { Sorting } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  getEffectiveColumns,
  getNormalizedColummns,
} from '@/components/Table/utils';

export type BatchColumnSettingsUpdate<TData> = {
  columnFilters?: ColumnFiltersState<TData>;
  // columnOrder?: ColumnOrderState<TData>;
  columnSizing?: ColumnSizingState<TData>;
  columnVisibility?: ColumnVisibilityState<TData>;
  sorting?: Sorting<TData>;
};

export const useBatchSetColumnSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate<TData>) => {
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const newSorting = [...(columnsState?.sorting ?? [])];
    if (settings.sorting) {
      newSorting.push(settings.sorting);
    }

    // const newColumnsOrder = [
    //   ...(columnsState?.columnOrder ?? []),
    //   ...(settings.columnOrder ?? []),
    // ];

    const newColumnFilters = {
      ...columnsState?.columnFilters,
      ...settings.columnFilters,
    };

    const newColumnSizing = {
      ...columnsState?.columnSizing,
      ...settings.columnSizing,
    };

    const effectiveColumns = getEffectiveColumns({
      columnOrder: columnsState?.columnOrder ?? [],
      columns: columnsState?.columns ?? [],
      columnVisibility: settings.columnVisibility,
    });

    const normalizedColumns = getNormalizedColummns({
      columns: columnsState?.columns ?? [],
      sorting: newSorting,
    });

    persistTableState([
      {
        persistenceKey,
        searchParamKey: 'filters',
        searchParamValue:
          Object.keys(newColumnFilters).length > 0
            ? JSON.stringify(newColumnFilters)
            : undefined,
        slice: 'columnFilters',
        valueSlice: newColumnFilters,
      },
      {
        persistenceKey,
        searchParamKey: 'sort',
        searchParamValue:
          Object.keys(newSorting).length > 0
            ? JSON.stringify(newSorting)
            : undefined,
        slice: 'sorting',
        valueSlice: newSorting,
      },
      {
        persistenceKey,
        slice: 'columnSizing',
        valueSlice: newColumnSizing,
      },
      {
        persistenceKey,
        slice: 'columnVisibility',
        valueSlice: settings.columnVisibility,
      },
    ]);

    console.log('[useBatchSetColumnSettings] Updating columns state with:', {
      ...settings,
      columnsState,
      effectiveColumns,
      normalizedColumns,
      sorting: newSorting,
    });

    columnsStore.set({
      ...settings,
      effectiveColumns,
      normalizedColumns,
      sorting: newSorting,
    });
  };
};
