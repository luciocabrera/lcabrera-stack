import type {
  FiltersDataState,
  TableColumn,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type FiltersDataContextValue<TData = Record<string, unknown>> = {
  /** Store managing filters lookup data */
  filtersDataStore: TStore<FiltersDataState<TData>>;
};

export type FiltersDataProviderProps<TData> = {
  children: React.ReactNode;
  columns: TableColumn<TData>[];
};
