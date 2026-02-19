import type { DataKey, FiltersDataState } from '@/components/Table/Table.types';

import { useFiltersStore } from '../useFiltersStore.hook';

export const useGetFilterData = <TData>(columnKey: DataKey<TData>) =>
  useFiltersStore<FiltersDataState<TData>[DataKey<TData>], TData>(
    (state) => state[columnKey],
  );
