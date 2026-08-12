import type { TableDataState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableDataContextValue<TData = Record<string, unknown>> = {
  /** Store managing data-related state */
  readonly dataStore: TStore<TableDataState<TData>>;
};

export type TableDataProviderProps<TData = Record<string, unknown>> = {
  readonly children: React.ReactNode;
  readonly dataState?: Partial<TableDataState<TData>>;
};
