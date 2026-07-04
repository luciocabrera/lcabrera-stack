import type { SortingState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnsSorting = () =>
  useColumnsStore<SortingState>((state) => state.sorting);
