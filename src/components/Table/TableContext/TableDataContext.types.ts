import type { TableDataState } from '../Table.types';

export type TableDataProviderProps<TData> = {
  children: React.ReactNode;
  dataState?: Partial<TableDataState<TData>>;
};
