import type {
  DataKey,
  FilterData,
  FiltersDataState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { toTableResponseError } from '#ui/components/Table/utils/toTableResponseError.util';

import { setFilterSlice } from './setFilterSlice.util';

type HandleFetchMoreFilterDataErrorArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentFilter: FilterData;
  readonly error: unknown;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
};

export const handleFetchMoreFilterDataError = <TData>({
  columnKey,
  currentFilter,
  error,
  filtersDataStore,
}: HandleFetchMoreFilterDataErrorArgs<TData>) => {
  setFilterSlice({
    columnKey,
    filter: {
      ...currentFilter,
      error: toTableResponseError({
        error,
        fallback: 'Failed to load more data',
      }),
      isLoadingMore: false,
    },
    filtersDataStore,
  });
};
