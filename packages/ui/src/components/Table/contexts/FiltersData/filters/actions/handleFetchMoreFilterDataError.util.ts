import type {
  DataKey,
  FilterData,
  FiltersDataState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import { getErrorMessage } from '@repo/ui/components/Table/utils/getErrorMessage.util';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { setFilterSlice } from './setFilterSlice.util';

type HandleFetchMoreFilterDataErrorArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentFilter: FilterData;
  readonly error: unknown;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
};

export const handleFetchMoreFilterDataError = <TData>({
  columnKey,
  currentFilter,
  error,
  filtersDataStore,
  metaStore,
}: HandleFetchMoreFilterDataErrorArgs<TData>) => {
  const message = getErrorMessage({
    error,
    fallback: 'Failed to load more data',
  });
  metaStore.set({ error: message });

  setFilterSlice({
    columnKey,
    filter: { ...currentFilter, isLoadingMore: false },
    filtersDataStore,
  });
};
