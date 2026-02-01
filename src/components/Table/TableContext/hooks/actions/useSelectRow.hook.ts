import { useCallback } from 'react';

import { useTableContextValue } from '@/components/Table/TableContext/hooks';

type SelectRowArgs = {
  isSelected: boolean;
  rowId: string;
};

/**
 * Hook to select/deselect a row
 * TODO: rowSelection needs to be added to TableDataState type
 */
export const useSelectRow = () => {
  const { dataStore } = useTableContextValue();

  return useCallback(
    ({ isSelected, rowId }: SelectRowArgs) => {
      // TODO: rowSelection is not yet in TableDataState - needs to be added
      const current = (dataStore.get() as { rowSelection?: Record<string, boolean> }).rowSelection ?? {};
      const rowSelection = { ...current, [rowId]: isSelected };
      dataStore.set({ rowSelection } as unknown as Parameters<typeof dataStore.set>[0]);
    },
    [dataStore],
  );
};
