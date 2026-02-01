import { useCallback } from 'react';

import { useTableContextValue } from '@/components/Table/TableContext/hooks';

/**
 * Hook to select/deselect all rows
 * TODO: rowSelection needs to be added to TableDataState type
 */
export const useSelectAllRows = () => {
  const { dataStore } = useTableContextValue();

  return useCallback(
    (isSelected: boolean) => {
      const data = dataStore.get()?.data ?? [];
      const rowSelection = isSelected
        ? Object.fromEntries(data.map((_, index) => [String(index), true]))
        : {};
      // TODO: rowSelection is not yet in TableDataState - needs to be added
      dataStore.set({ rowSelection } as unknown as Parameters<typeof dataStore.set>[0]);
    },
    [dataStore],
  );
};
