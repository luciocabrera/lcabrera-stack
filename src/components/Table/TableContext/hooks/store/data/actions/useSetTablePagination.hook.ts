import { useCallback } from 'react';

import type { PaginationState } from '@/components/Table/Table.types';

import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

/**
 * Hook to update pagination
 */
export const useSetTablePagination = () => {
  const { dataStore } = useTableDataContextValue();

  return useCallback(
    (pagination: Partial<PaginationState>) => {
      const current = dataStore.get()?.pagination ?? {
        limit: 50,
        skip: 0,
      };
      dataStore.set({
        pagination: { ...current, ...pagination },
      });
    },
    [dataStore],
  );
};
