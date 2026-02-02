import type { TStore } from '@/hooks/useStore.hook';

import type { TableColumnsState, TableMetaState } from '../Table.types';

export type TableConfigContextValue = {
  /** Store managing column-related state */
  columnsStore: TStore<TableColumnsState<unknown>>;
  /** Store managing meta-related state */
  metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData> = {
  children: React.ReactNode;
  columnsState?: Partial<TableColumnsState<TData>>;
  metaState?: Partial<TableMetaState>;
};
