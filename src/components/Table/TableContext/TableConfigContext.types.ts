import type { TableColumnsState, TableMetaState } from '../Table.types';

export type TableConfigProviderProps<TData> = {
  children: React.ReactNode;
  columnsState?: Partial<TableColumnsState<TData>>;
  metaState?: Partial<TableMetaState>;
};
