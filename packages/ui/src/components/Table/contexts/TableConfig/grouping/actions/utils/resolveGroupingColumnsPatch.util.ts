import type {
  TableColumnAggregate,
  TableColumnsState,
} from '#ui/components/Table/Table.types';
import type { ColumnAxisEmittedAggregate } from '#ui/components/Table/utils/columnAxisEmitted.types';

import {
  deriveColumnViewState,
  pruneSortingToColumns,
} from '#ui/components/Table/utils';

type ResolveGroupingColumnsPatchArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnAxis?: string;
  readonly columnAxisEmitted?: readonly ColumnAxisEmittedAggregate[];
  readonly columnsState: TableColumnsState<TData>;
  readonly groupingKeys: readonly string[];
};

export const resolveGroupingColumnsPatch = <TData>({
  aggregates,
  columnAxis,
  columnAxisEmitted,
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
    ...(columnAxis !== undefined && { columnAxis }),
    ...(columnAxisEmitted !== undefined && { columnAxisEmitted }),
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
