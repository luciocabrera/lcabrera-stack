import type { TableColumn } from '#ui/components/Table/Table.types';

import type { GroupKeyItem } from '../GroupingSection.types';

type ToGroupKeyItemsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly keys: readonly string[];
};

/**
 * The applied group keys paired with their human labels, **in key order**.
 *
 * Driven off the keys rather than off the columns, which is what preserves that
 * order: the columns are in display order, and the grouping's order is the
 * query's nesting order. Mapping the columns instead would silently re-sort the
 * list into something that reads plausible and describes a different query.
 *
 * A key with no matching column falls back to the key itself rather than being
 * dropped, so a grouping the drawer cannot fully name is still one the user can
 * see and remove.
 */
export const toGroupKeyItems = <TData extends Record<string, unknown>>({
  columns,
  keys,
}: ToGroupKeyItemsArgs<TData>): readonly GroupKeyItem[] =>
  keys.map((columnKey) => ({
    columnKey,
    label:
      columns.find((column) => String(column.key) === columnKey)?.label ??
      columnKey,
  }));
