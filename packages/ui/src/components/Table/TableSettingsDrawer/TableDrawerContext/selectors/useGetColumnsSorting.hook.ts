import type { SortingState } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnsSorting = () =>
  useColumnsStore<SortingState>((state) => state.sorting);
