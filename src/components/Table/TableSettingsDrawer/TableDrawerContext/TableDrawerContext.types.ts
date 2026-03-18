import type { TableColumnsState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

export type TableDrawerColumnsState<TData> = Pick<
  TableColumnsState<TData>,
  | 'columnFilters'
  | 'columnOrder'
  | 'columnPinning'
  | 'columnSizing'
  | 'columnVisibility'
  | 'sorting'
>;

export type TableDrawerContextValue = {
  /** Store managing column-related state */
  columnsStore: TStore<TableDrawerColumnsState<Record<string, unknown>>>;
};

export type TableDrawerProviderProps = {
  children: React.ReactNode;
};
