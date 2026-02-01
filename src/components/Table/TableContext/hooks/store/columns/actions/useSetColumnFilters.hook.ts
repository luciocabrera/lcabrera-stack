import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import type { ColumnFiltersState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils';

/**
 * Hook to update column filters
 */
export const useSetColumnFilters = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(
    (columnFilters: ColumnFiltersState) => {
      // Persist to falling back storage mechanism (cookie/localStorage)
      writeStateSlice({
        persistenceKey,
        slice: 'columnFilters',
        storageType: 'cookie',
        value: columnFilters,
      });
      setSearchParams((params) => {
        if (Object.keys(columnFilters).length > 0) {
          params.set('filters', JSON.stringify(columnFilters));
        } else {
          params.delete('filters');
        }
        return params;
      });
      columnsStore.set({ columnFilters });
    },
    [persistenceKey, setSearchParams, columnsStore],
  );
};
