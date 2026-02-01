import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils';

/**
 * Hook to clear all column filters
 */
export const useResetColumnFilters = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();
  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback(() => {
    const current = columnsState?.columnFilters ?? {};

    if (Object.keys(current).length === 0) {
      // No filters to clear
      return;
    }
    // Persist to falling back storage mechanism (cookie/localStorage)
    writeStateSlice({
      persistenceKey,
      slice: 'columnFilters',
      storageType: 'cookie',
      value: {},
    });
    setSearchParams((params) => {
      params.delete('filters');
      return params;
    });
    columnsStore.set({ columnFilters: {} });
  }, [persistenceKey, setSearchParams, columnsState?.columnFilters, columnsStore]);
};
