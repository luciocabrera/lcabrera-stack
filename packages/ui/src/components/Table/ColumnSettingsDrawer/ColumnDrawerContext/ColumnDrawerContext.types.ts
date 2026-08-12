import type { ComponentProps } from 'react';

import type { DataKey } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';
import type { ColumnFilter } from '#ui/types/filterOperators.types';
import type { SortDirection } from '#ui/types/ui.types';

export type ColumnDrawerContextValue<TData = Record<string, unknown>> = {
  /** Store managing column-related state */
  readonly columnStore: TStore<ColumnDrawerState<TData>>;
};

export type ColumnDrawerProviderProps = ComponentProps<'div'>;
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
