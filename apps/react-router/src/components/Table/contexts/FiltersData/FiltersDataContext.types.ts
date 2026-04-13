import type {
  FiltersDataState,
  TableColumn,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type FiltersDataContextValue<TData = Record<string, unknown>> = {
  /** Store managing filters lookup data */
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
};

export type FiltersDataProviderProps<TData> = {
  readonly children: React.ReactNode;
  readonly columns: TableColumn<TData>[];
};
