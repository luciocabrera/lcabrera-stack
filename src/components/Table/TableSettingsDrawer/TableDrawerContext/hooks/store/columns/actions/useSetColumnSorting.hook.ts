import type { Sorting } from '@/types/ui.types';

import { useTableDrawerContextValue } from '../../../useTableDrawerContextValue.hook';

export const useSetColumnSorting = () => {
  const { columnsStore } = useTableDrawerContextValue();

  return ({ columnKey, direction }: Sorting) => {
    const columnsState = columnsStore.get();
    const sorting = columnsState?.sorting ?? [];
    const currentSort = sorting.find((s) => s.columnKey === columnKey);

    if (currentSort?.direction === direction) {
      // No change in sort
      return;
    }
    const newSorting = sorting
      .map((s) => {
        if (s.columnKey === columnKey) {
          return { columnKey, direction };
        }
        return s;
      })
      .filter((s) => s.direction); // Remove any with undefined direction

    columnsStore.set({ sorting: newSorting });
  };
};
