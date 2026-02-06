import type { ColumnVisibilityState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { getEffectiveColumns } from '@/components/Table/utils/getEffectiveColumns.util';

/**
 * Hook to update column visibility
 */
export const useSetColumnsVisibility = () => {
  const { columnsStore } = useTableConfigContextValue();
  const columnsState = columnsStore.get();

  const effectiveColumns = getEffectiveColumns({
    columnOrder: columnsState?.columnOrder,
    columns: columnsState?.columns ?? [],
    columnVisibility: columnsState?.columnVisibility,
  });
  
  return (columnVisibility: ColumnVisibilityState) => {
    columnsStore.set({ columnVisibility, effectiveColumns });
  };
};
