import type { ComponentProps } from 'react';

import type { DataKey } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';
import type { ColumnFilter } from '#ui/types/filterOperators.types';
import type { SortDirection } from '#ui/types/ui.types';

export type ColumnDrawerContextValue<TData = Record<string, unknown>> = {
  readonly columnStore: TStore<ColumnDrawerState<TData>>;
};

export type ColumnDrawerProviderProps = ComponentProps<'div'>;
export type ColumnDrawerState<TData> = {
  readonly columnFilter?: ColumnFilter;
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: 'left' | 'right';
  readonly columnSizing?: number;
  readonly sorting: SortDirection;
};
