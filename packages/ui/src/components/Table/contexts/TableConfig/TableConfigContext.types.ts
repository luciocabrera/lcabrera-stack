import type {
  TableColumnsState,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly expansionStore: TStore<TableGroupExpansionState>;
  readonly groupingStore: TStore<TableGroupingState>;
  readonly metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData extends Record<string, unknown>> = {
  readonly children: React.ReactNode;
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly metaState?: Partial<TableMetaState>;
};
