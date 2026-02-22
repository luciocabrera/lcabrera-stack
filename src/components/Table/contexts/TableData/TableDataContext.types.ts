import type {
  TableDataState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type TableDataContextValue = {
  /** Store managing data-related state */
  dataStore: TStore<TableDataState<unknown>>;
};

export type TableDataProviderProps<TData> = {
  children: React.ReactNode;
  dataState?: Partial<TableDataState<TData>>;
};
