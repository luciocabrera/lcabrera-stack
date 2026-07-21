import type { SortDirection } from '@lcabrera/ui/types/ui.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnSorting = () =>
  useColumnsStore<SortDirection>((state) => state.sorting);
