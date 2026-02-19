import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  getEffectiveColumns,
  getNormalizedColummns,
  writeStateSlice,
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
  const [, setSearchParams] = useSearchParams();
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

      console.log(
        '[useBatchSetTableSettings] Effective Columns:',
        effectiveColumns,
      );
      console.log(
        '[useBatchSetTableSettings] Normalized Columns:',
        normalizedColumns,
      );

      const slices: (keyof BatchTableSettingsUpdate<TData>)[] = [
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

      columnsStore.set({ ...settings, effectiveColumns, normalizedColumns });
    },
    [columnsStore, persistenceKey, setSearchParams, columnsState],
  );
};
