import type { TableColumn } from '#ui/components/Table';
import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type SanitizeGroupingByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly grouping: TableGroupingState;
};

const NO_GROUPING: TableGroupingState = { aggregates: {}, keys: [] };

/**
 * Narrows a URL-supplied grouping configuration to what this route's columns
 * actually allow, and refuses the **whole** configuration rather than dropping
 * part of it.
 *
 * Whole-state refusal is the contract (ADR-061), and grouping is where it earns
 * its keep: keys are ordered, and the order is the query's nesting order, so
 * dropping one silently answers a different question from the one the URL
 * describes. `sanitizeFiltersByColumns` drops per entry because a filter list is
 * a conjunction where each term stands alone; a key list is not. An aggregate
 * dropped on its own would mislead the same way — the numbers a shared link
 * promised would simply be absent from the table it opened.
 *
 * A duplicate key is refused for the same reason, and so is a list longer than
 * `MAX_TABLE_GROUP_KEYS`: the server refuses both too, and turning a 400 into a
 * flat table beats turning it into a 500.
 *
 * `resolveColumnCapabilities` is the only column predicate here: a column keyed
 * `actions` is refused because `createActionsColumn` declares it ungroupable,
 * not because this function knows about that key. An aggregate's column is
 * checked for **existence** only — whether a given function is legal for it is a
 * catalogue answer (ADR-058) that no client-side column declaration can supply,
 * and the server's `assertGroupAggregates` is what enforces that half.
 */
export const sanitizeGroupingByColumns = <
  TData extends Record<string, unknown>,
>({
  columns,
  grouping,
}: SanitizeGroupingByColumnsArgs<TData>): TableGroupingState => {
  const { aggregates, keys } = grouping;

  if (keys.length === 0 || keys.length > MAX_TABLE_GROUP_KEYS) {
    return NO_GROUPING;
  }

  const groupableKeys = new Set(
    columns
      .filter((column) => resolveColumnCapabilities(column).isGroupable)
      .map((column) => String(column.key)),
  );
  const declaredKeys = new Set(columns.map((column) => String(column.key)));

  const isEveryKeyGroupable = keys.every((key) => groupableKeys.has(key));
  const areKeysDistinct = new Set(keys).size === keys.length;
  const isEveryAggregateColumnDeclared = Object.keys(aggregates).every(
    (column) => declaredKeys.has(column),
  );

  return isEveryKeyGroupable &&
    areKeysDistinct &&
    isEveryAggregateColumnDeclared
    ? { aggregates: { ...aggregates }, keys: [...keys] }
    : NO_GROUPING;
};
