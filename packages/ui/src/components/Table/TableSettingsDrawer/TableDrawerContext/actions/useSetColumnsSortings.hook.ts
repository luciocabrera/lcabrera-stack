import type { SortingState } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetColumnsSortings = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return (sorting: SortingState) => {
    columnsStore.set({
      sorting: sorting.filter((s) => s.columnKey !== 'actions'),
    });
  };
};
