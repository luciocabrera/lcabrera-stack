import type {
  ColumnOrderState,
  ColumnVisibilityState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to reset column order and visibility to the original table configuration state
 */
export const useResetColumnOrderAndVisibility = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState),
      columnVisibility:
        columnsState?.columnVisibility ?? ({} as ColumnVisibilityState),
    });
  };
};
