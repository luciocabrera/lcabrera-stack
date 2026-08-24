import type { ColumnOrderState } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetColumnsOrder = <TData>() => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnOrder: ColumnOrderState<TData>) => {
    columnsStore.set({ columnOrder });
  };
};
