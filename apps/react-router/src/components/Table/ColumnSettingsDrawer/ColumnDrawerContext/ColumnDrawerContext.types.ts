import type { DataKey } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';
import type { ColumnFilter } from '@/types/filterOperators.types';
import type { SortDirection } from '@/types/ui.types';

export type ColumnDrawerContextValue = {
  /** Store managing column-related state */
  readonly columnStore: TStore<ColumnDrawerState<Record<string, unknown>>>;
};

export type ColumnDrawerProviderProps<TData> = {
  readonly children: React.ReactNode;
  readonly columnKey: DataKey<TData>;
};

export type ColumnDrawerState<TData> = {
  /** Filter for this specific column */
  readonly columnFilter?: ColumnFilter;
  /** The column key this drawer is managing */
  readonly columnKey: DataKey<TData>;
  /** Pin side for this specific column */
  readonly columnPinning?: 'left' | 'right';
  /** Width for this specific column */
  readonly columnSizing?: number;
  /** Sort direction for this specific column */
  readonly sorting: SortDirection;
};
