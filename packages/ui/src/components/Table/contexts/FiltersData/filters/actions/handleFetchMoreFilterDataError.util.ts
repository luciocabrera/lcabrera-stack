import type {
  DataKey,
  FilterData,
  FiltersDataState,
  TableMetaState,
} from '@lcabrera/ui/components/Table/Table.types';
import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';

import { getErrorMessage } from '@lcabrera/utils/errors/get-error-message.util';

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
