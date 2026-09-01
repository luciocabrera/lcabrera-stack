import type {
  TableColumn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { resolveAggregateColumnLabel } from '#ui/components/Table/utils/resolveAggregateColumnLabel.util';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import type { AggregateItem } from '../GroupingSection.types';

type ToAggregateItemsArgs<TData extends Record<string, unknown>> = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly columns: readonly TableColumn<TData>[];
};

export const toAggregateItems = <TData extends Record<string, unknown>>({
  aggregates,
  columns,
}: ToAggregateItemsArgs<TData>): readonly AggregateItem[] => {
  const columnByKey = new Map(
    columns.map((column) => [String(column.key), column]),
  );

  return aggregates
    .filter(({ columnKey }) => columnByKey.has(columnKey))
    .map(({ columnKey, fn }) => ({
      columnKey,
      fn,
      id: toTableAggregateToken({ columnKey, fn }),
      label:
        resolveAggregateColumnLabel({
          columnKey: toTableAggregateToken({ columnKey, fn }),
          columns,
        }) ?? columnKey,
    }));
};
