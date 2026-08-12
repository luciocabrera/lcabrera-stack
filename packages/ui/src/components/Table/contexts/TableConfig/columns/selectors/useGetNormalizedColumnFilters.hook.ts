import type {
  ColumnFiltersState,
  DataKey,
} from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetNormalizedColumnFilters = <TData>(
  columnKey: DataKey<TData>,
) =>
  useColumnsStore<ColumnFiltersState<TData>[DataKey<TData>], TData>(
    (state) => state.columnFilters[columnKey],
  );
