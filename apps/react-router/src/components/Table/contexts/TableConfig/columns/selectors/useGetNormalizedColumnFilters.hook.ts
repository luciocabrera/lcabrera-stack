import type {
  ColumnFiltersState,
  DataKey,
} from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetNormalizedColumnFilters = <TData>(
  columnKey: DataKey<TData>,
) =>
  useColumnsStore<ColumnFiltersState<TData>[DataKey<TData>], TData>(
    (state) => state.columnFilters[columnKey],
  );
