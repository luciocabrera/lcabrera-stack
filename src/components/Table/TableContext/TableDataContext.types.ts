import type { TStore } from '@/hooks/useStore.hook';

import type { FiltersDataState, TableDataState } from '../Table.types';

export type TableDataContextValue = {
  /** Store managing data-related state */
  dataStore: TStore<TableDataState<unknown>>;
  /** Store managing filters-related state */
  filtersDataStore: TStore<FiltersDataState<unknown>>;
};

export type TableDataProviderProps<TData> = {
  children: React.ReactNode;
  dataState?: Partial<TableDataState<TData>>;
  filtersDataState?: Partial<FiltersDataState<TData>>;
};
