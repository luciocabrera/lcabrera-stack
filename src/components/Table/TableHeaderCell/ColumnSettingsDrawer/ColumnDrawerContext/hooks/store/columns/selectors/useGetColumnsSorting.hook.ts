import type { Sorting } from '@/types/ui.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnsSorting = () =>
  useColumnsStore<Sorting<unknown>>((state) => state.sorting);
