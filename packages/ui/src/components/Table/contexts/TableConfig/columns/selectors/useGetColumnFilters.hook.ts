import type { ColumnFiltersState } from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnFilters = <TData>() =>
  useColumnsStore<ColumnFiltersState<TData>, TData>(
    (state) => state.columnFilters,
  );
