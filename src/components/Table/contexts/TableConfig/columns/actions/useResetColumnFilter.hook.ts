import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { writeStateSlice } from '@/components/Table/utils';

/**
 * Hook to clear a single column filter
 */
export const useResetColumnFilter = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();
  const [, setSearchParams] = useSearchParams();

  const columnsState = columnsStore.get();
  const persistenceKey = metaStore.get()?.persistenceKey ?? '';

  return useCallback((columnKey: string) => {
    const current = columnsState?.columnFilters ?? {};
    const { [columnKey]: unusedFilter, ...rest } = current;
    void unusedFilter; // Explicitly mark as intentionally unused

    // Persist to falling back storage mechanism (cookie/localStorage)
    writeStateSlice({
      persistenceKey,
      slice: 'columnFilters',
      storageType: 'cookie',
      value: rest,
    });

    setSearchParams((params) => {
      if (Object.keys(rest).length > 0) {
        params.set('filters', JSON.stringify(rest));
      } else {
        params.delete('filters');
      }
      return params;
    });
    columnsStore.set({ columnFilters: rest });
  }, [columnsStore, persistenceKey, setSearchParams, columnsState]);
};
