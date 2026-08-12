import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnFilter = () =>
  useColumnsStore<ColumnFilter | undefined>((state) => state.columnFilter);
