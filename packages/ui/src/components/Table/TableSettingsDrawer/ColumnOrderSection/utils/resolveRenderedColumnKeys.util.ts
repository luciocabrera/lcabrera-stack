import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';
import type { ColumnAxisEmittedAggregate } from '#ui/components/Table/utils/columnAxisEmitted.types';

import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';
import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

type ResolveRenderedColumnKeysArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnAxis?: string;
  readonly columnAxisEmitted?: readonly ColumnAxisEmittedAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

export const resolveRenderedColumnKeys = <TData>({
  aggregates,
  columnAxis,
  columnAxisEmitted,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: ResolveRenderedColumnKeysArgs<TData>): readonly string[] => {
  const { effectiveColumns } = getPinnedDerivedColumnsState<TData>({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    groupingKeys,
    ...(columnAxis !== undefined && { columnAxis }),
    ...(columnAxisEmitted !== undefined && { columnAxisEmitted }),
  });

  return [
    ...new Set(
      effectiveColumns.map((column) =>
        String(toDeclaredColumnKey<TData>({ columnKey: column.key, columns })),
      ),
    ),
  ];
};
