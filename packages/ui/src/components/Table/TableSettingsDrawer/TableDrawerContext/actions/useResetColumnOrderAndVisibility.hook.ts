import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

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
      columnVisibility: columnsState?.columnVisibility ?? new Set(),
    });
  };
};
