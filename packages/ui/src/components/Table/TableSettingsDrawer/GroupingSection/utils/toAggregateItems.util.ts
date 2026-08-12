import type {
  TableColumn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';

type ToAggregateItemsArgs<TData extends Record<string, unknown>> = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The selected aggregates as labelled rows, in the table's own column order.
 *
 * Column order rather than insertion order, because the map has none worth
 * showing: unlike the group keys, aggregates are unordered — nothing about the
 * query depends on which was picked first — so the order the user already reads
 * the table in is the useful one.
 *
 * An aggregate on a column this route does not declare is dropped rather than
 * labelled with its key. It cannot be reached through the UI (both surfaces
 * build from the columns) and the loader's sanitizer refuses the whole grouping
 * when a URL carries one, so a row here would describe a state that does not
 * survive a reload.
 */
export const toAggregateItems = <TData extends Record<string, unknown>>({
  aggregates,
  columns,
}: ToAggregateItemsArgs<TData>) => {
  const columnByKey = new Map(
    columns.map((column) => [String(column.key), column]),
  );
  const columnOrder = columnByKey.keys().toArray();

  return Object.entries(aggregates)
    .filter(([columnKey]) => columnByKey.has(columnKey))
    .map(([columnKey, fn]) => ({
      columnKey,
      fn,
      label: `${TABLE_AGGREGATE_LABELS[fn]} of ${columnByKey.get(columnKey)?.label ?? columnKey}`,
    }))
    .toSorted(
      (a, b) =>
        columnOrder.indexOf(a.columnKey) - columnOrder.indexOf(b.columnKey),
    );
};
