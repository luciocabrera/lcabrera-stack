import type { TableColumnsState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type TableDrawerColumnsState<TData> = Pick<
  TableColumnsState<TData>,
  | 'columnFilters'
  | 'columnOrder'
  | 'columnPinning'
  | 'columnSizing'
  | 'columnVisibility'
  | 'sorting'
>;

export type TableDrawerContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnsStore: TStore<TableDrawerColumnsState<TData>>;
};

export type TableDrawerProviderProps = {
  readonly children: React.ReactNode;
};
