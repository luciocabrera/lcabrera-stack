import type { SortDirection } from '@/types/ui.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnSorting = () =>
  useColumnsStore<SortDirection>((state) => state.sorting);
