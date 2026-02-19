import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  columnsStore: TStore<TableColumnsState<TData>>;
  /** Store managing meta-related state */
  metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData> = {
  children: React.ReactNode;
  columnsState?: Partial<TableColumnsState<TData>>;
  metaState?: Partial<TableMetaState>;
};
