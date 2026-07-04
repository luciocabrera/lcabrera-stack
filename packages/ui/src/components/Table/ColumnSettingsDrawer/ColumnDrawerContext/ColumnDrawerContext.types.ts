import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';
import type { SortDirection } from '@repo/ui/types/ui.types';

export type ColumnDrawerContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnStore: TStore<ColumnDrawerState<TData>>;
};

export type ColumnDrawerProviderProps<TData = Record<string, unknown>> = {
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
