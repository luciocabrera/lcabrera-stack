import type { ColumnFiltersState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnFilters = () =>
  useColumnsStore<ColumnFiltersState>((state) => state.columnFilters);
