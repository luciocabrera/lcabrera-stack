import type { SortingState } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnsSorting = <TData = Record<string, unknown>>() =>
  useColumnsStore<SortingState<TData>>(
    (state) => state.sorting as SortingState<TData>,
  );
