import type {
  TableColumnsState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  /**
   * Store managing row grouping. It sits on the config context, not the data
   * context, because it has to outlive a data revalidation: `TableDataProvider`
   * is re-created on every navigation, and a grouping change *causes* one — so
   * grouping state placed there would be wiped by its own effect (ADR-061).
   */
  readonly groupingStore: TStore<TableGroupingState>;
  /** Store managing meta-related state */
  readonly metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData extends Record<string, unknown>> = {
  readonly children: React.ReactNode;
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly metaState?: Partial<TableMetaState>;
};
