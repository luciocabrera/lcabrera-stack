import type {
  TableColumnsState,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { ColumnAxisEmittedAggregate } from '#ui/components/Table/utils/columnAxisEmitted.types';
import type { TStore } from '#ui/hooks/useStore.hook';
import type { PersistCookieEntry } from '#ui/routing/actions/routing.types';

export type TableConfigContextValue<TData = Record<string, unknown>> = {
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly expansionStore: TStore<TableGroupExpansionState>;
  readonly groupingStore: TStore<TableGroupingState>;
  readonly metaStore: TStore<TableMetaState>;
};

export type TableConfigProviderProps<TData extends Record<string, unknown>> = {
  readonly children: React.ReactNode;
  readonly columnAxisEmitted?: readonly ColumnAxisEmittedAggregate[];
  readonly columnsState?: Partial<TableColumnsState<TData>>;
  readonly groupingState?: Partial<TableGroupingState>;
  readonly metaState?: Partial<TableMetaState>;
};

export type TablePersistence = {
  readonly columnSizing: PersistCookie;
  readonly tableState: PersistCookie;
  readonly uiFlags: PersistCookie;
};

type PersistCookie = (entries: readonly PersistCookieEntry[]) => void;
