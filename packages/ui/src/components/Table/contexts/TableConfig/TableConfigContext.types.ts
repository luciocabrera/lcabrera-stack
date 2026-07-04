import type {
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  /** Store managing meta-related state */
  readonly metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData> = {
  readonly children: React.ReactNode;
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly metaState?: Partial<TableMetaState>;
};
