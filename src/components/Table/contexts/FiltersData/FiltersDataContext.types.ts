import type { FiltersDataState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type FiltersDataContextValue = {
  /** Store managing filters lookup data */
  filtersDataStore: TStore<FiltersDataState<unknown>>;
};
