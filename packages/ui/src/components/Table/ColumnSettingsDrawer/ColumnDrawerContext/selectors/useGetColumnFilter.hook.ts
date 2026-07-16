import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnFilter = () =>
  useColumnsStore<ColumnFilter | undefined>((state) => state.columnFilter);
