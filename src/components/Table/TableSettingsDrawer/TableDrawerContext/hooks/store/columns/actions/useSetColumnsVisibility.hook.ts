import type { ColumnVisibilityState } from '@/components/Table/Table.types';

import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

export const useSetColumnsVisibility = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnVisibility: ColumnVisibilityState) => {
    columnsStore.set({ columnVisibility });
  };
};
