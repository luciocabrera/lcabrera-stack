import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { getEffectiveColumns } from '@/components/Table/TableContext/utils/getEffectiveColumns.util';

/**
 * Hook to update column order
 */
export const useSetColumnsOrder = () => {
  const { columnsStore } = useTableConfigContextValue();
  const columnsState = columnsStore.get();

  const effectiveColumns = getEffectiveColumns({
    columnOrder: columnsState?.columnOrder,
    columns: columnsState?.columns ?? [],
    columnVisibility: columnsState?.columnVisibility,
  });

  return (columnOrder: ColumnOrderState) => {
    columnsStore.set({ columnOrder, effectiveColumns });
  };
};
