import type {
  TableColumn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import type { AggregateItem } from '../GroupingSection.types';

type ToAggregateItemsArgs<TData extends Record<string, unknown>> = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The staged order rather than the table's column order, and the reason changed with the
 * shape: a column may now carry several aggregates, so column order no longer orders the
 * list at all — and the list's own order is state the user arranged by dragging these very
 * rows (#832), carried in the `grouping` param.
 * Re-sorting here would silently discard it.
 */
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
      label: `${TABLE_AGGREGATE_LABELS[fn]} of ${columnByKey.get(columnKey)?.label ?? columnKey}`,
    }));
};
