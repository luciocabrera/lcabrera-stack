import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnFilter = () =>
  useColumnsStore<ColumnFilter | undefined>((state) => state.columnFilter);
