import type {
  TableColumnsState,
  TableDensity,
  TableGroupingState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';
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
  readonly columnsStore: TStore<TableDrawerColumnsState<TData>>;
  readonly densityStore: TStore<TableDrawerDensityState>;
  readonly groupingStore: TStore<TableGroupingState>;
  readonly totalsPlacementStore: TStore<TableDrawerTotalsPlacementState>;
};

export type TableDrawerDensityState = {
  readonly density: TableDensity;
};

export type TableDrawerProviderProps = {
  readonly children: React.ReactNode;
};

export type TableDrawerTotalsPlacementState = {
  readonly totalsPlacement: TableTotalsPlacement;
};
