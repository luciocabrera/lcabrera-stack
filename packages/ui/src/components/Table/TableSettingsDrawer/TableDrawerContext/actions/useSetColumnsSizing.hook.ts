import type { ColumnSizingState } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetColumnsSizing = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (columnSizing: ColumnSizingState) => {
    columnsStore.set({ columnSizing });
  };
};
