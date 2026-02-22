import type { TableDataState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type TableDataContextValue<TData = Record<string, unknown>> = {
  /** Store managing data-related state */
  dataStore: TStore<TableDataState<TData>>;
};

export type TableDataProviderProps<TData = Record<string, unknown>> = {
  children: React.ReactNode;
  dataState?: Partial<TableDataState<TData>>;
};
