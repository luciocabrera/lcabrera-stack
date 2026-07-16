import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
} from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to reset column order, visibility, and pinning to the original table configuration state
 */
export const useResetColumnOrderAndVisibility = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const columnsState = columnsStore.get();

    columnsDrawerStore.set({
      columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState),
      columnPinning:
        columnsState?.columnPinning ??
        ({ left: [], right: [] } as ColumnPinningState),
      columnVisibility:
        columnsState?.columnVisibility ?? ({} as ColumnVisibilityState),
    });
  };
};
