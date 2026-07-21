import type { SortingState } from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnsSorting = () =>
  useColumnsStore<SortingState>((state) => state.sorting);
