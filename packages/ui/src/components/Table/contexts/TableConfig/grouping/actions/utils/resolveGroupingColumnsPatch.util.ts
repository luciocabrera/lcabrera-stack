import type {
  TableColumnAggregate,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

import {
  deriveColumnViewState,
  pruneSortingToColumns,
} from '#ui/components/Table/utils';

type ResolveGroupingColumnsPatchArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnsState: TableColumnsState<TData>;
  readonly groupingKeys: readonly string[];
};

export const resolveGroupingColumnsPatch = <TData>({
  aggregates,
  columnsState,
  groupingKeys,
}: ResolveGroupingColumnsPatchArgs<TData>) => {
  const derived = deriveColumnViewState<TData>({
    aggregates,
    columnOrder: columnsState.columnOrder,
    columnPinning: columnsState.columnPinning,
    columns: columnsState.columns,
    columnSizing: columnsState.columnSizing,
    columnVisibility: columnsState.columnVisibility,
    groupingKeys,
    sorting: columnsState.sorting,
  });

  return {
    ...derived,
    sorting: pruneSortingToColumns<TData>({
      declaredColumnKeys: columnsState.columns.map((column) =>
        String(column.key),
      ),
      gridColumnKeys: Object.keys(derived.normalizedColumns),
      sorting: columnsState.sorting,
    }),
  };
};
