import type { SortDirection } from '@/types/ui.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetColumnSorting = () =>
  useColumnsStore<SortDirection>((state) => state.sorting);
