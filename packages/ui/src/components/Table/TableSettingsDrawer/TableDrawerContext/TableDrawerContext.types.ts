import type {
  TableColumnsState,
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
  /** Store managing column-related state */
  readonly columnsStore: TStore<TableDrawerColumnsState<TData>>;
  /**
   * Draft copy of the table's grouping configuration. A second store rather
   * than a slice of the columns draft because the two commit to different
   * places: column state to the cookie, grouping to the `grouping` search
   * param (ADR-061).
   */
  readonly groupingStore: TStore<TableGroupingState>;
  /**
   * Draft copy of the totals placement. A third store rather than a field on
   * either draft above, because it commits to a third place again: the
   * `totals` search param *and* the UI-flags cookie, where grouping is
   * param-only and column state is cookie-only (#578).
   */
  readonly totalsPlacementStore: TStore<TableDrawerTotalsPlacementState>;
};

export type TableDrawerProviderProps = {
  readonly children: React.ReactNode;
};

export type TableDrawerTotalsPlacementState = {
  readonly totalsPlacement: TableTotalsPlacement;
};
