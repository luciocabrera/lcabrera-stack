import type {
  TableColumn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ToAggregateItemsArgs<TData extends Record<string, unknown>> = {
  readonly aggregates: TableGroupingState['aggregates'];
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The selected aggregates as labelled rows, **in the order they are staged**.
 *
 * The staged order rather than the table's column order, and the reason changed
 * with the shape: a column may now carry several aggregates, so column order no
 * longer orders the list at all — and the list's own order is state the user
 * arranged, carried in the `grouping` param and made draggable by #832.
 * Re-sorting here would silently discard it.
 *
 * `id` is the row's identity — the `(columnKey, fn)` pair as one string — since
 * neither half is unique on its own and a React key has to be. It is the same
 * spelling the URL token uses, from the same function, so the two cannot drift.
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

  return aggregates
    .filter(({ columnKey }) => columnByKey.has(columnKey))
    .map(({ columnKey, fn }) => ({
      columnKey,
      fn,
      id: toTableAggregateToken({ columnKey, fn }),
      label: `${TABLE_AGGREGATE_LABELS[fn]} of ${columnByKey.get(columnKey)?.label ?? columnKey}`,
    }));
};
