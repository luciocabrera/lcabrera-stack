import type {
  TableColumnsState,
  TableGroupDrillFetcher,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  /**
   * Store managing which group rows are collapsed. It sits beside the grouping
   * store for the same lifecycle reason, and apart from it because grouping
   * configuration crosses the loader boundary while expansion never does
   * (ADR-067).
   */
  readonly expansionStore: TStore<TableGroupExpansionState>;
  /**
   * Store managing row grouping. It sits on the config context, not the data
   * context, because it has to outlive a data revalidation: `TableDataProvider`
   * is re-created on every navigation, and a grouping change *causes* one — so
   * grouping state placed there would be wiped by its own effect (ADR-061).
   */
  readonly groupingStore: TStore<TableGroupingState>;
  /** Store managing meta-related state */
  readonly metaStore: TStore<TableMetaState>;
  /**
   * How a group fetches its own rows (ADR-079). Absent means a drill cannot be
   * performed however the meta capability is set — the two answer different
   * questions, and both must say yes: `isGroupDrillEnabled` is the route
   * declaring its endpoint exists, this is the call that reaches it.
   *
   * It lives on the config context rather than the data one because the toggle
   * that starts a drill lives here, and because `TableDataProvider` is
   * re-created on every navigation — the same reason grouping state is here
   * (ADR-061).
   */
  readonly onDrillGroup?: TableGroupDrillFetcher;
};

export type TableConfigProviderProps<TData extends Record<string, unknown>> = {
  readonly children: React.ReactNode;
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly metaState?: Partial<TableMetaState>;
  /** How a group fetches its own rows — see the context value. */
  readonly onDrillGroup?: TableGroupDrillFetcher;
};
