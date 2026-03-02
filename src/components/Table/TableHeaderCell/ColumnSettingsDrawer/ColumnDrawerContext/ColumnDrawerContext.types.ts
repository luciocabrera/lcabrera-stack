import type { DataKey } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

export type ColumnDrawerContextValue = {
  /** Store managing column-related state */
  columnStore: TStore<ColumnDrawerState<unknown>>;
};

export type ColumnDrawerProviderProps<TData> = {
  children: React.ReactNode;
  columnKey: DataKey<TData>;
};

export type ColumnDrawerState<TData> = {
  /** Filter for this specific column */
  columnFilter: ColumnFilter | undefined;
  /** The column key this drawer is managing */
  columnKey: DataKey<TData>;
  /** Width for this specific column */
  columnSizing: number | undefined;
  /** Sort direction for this specific column */
  sorting: SortDirection;
};
