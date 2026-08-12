import type { TableColumn } from '#ui/components/Table';

import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

type SanitizeGroupingByColumnsArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly grouping: readonly string[];
};

/**
 * Narrows URL-supplied group keys to the ones this route's columns actually
 * allow, and refuses the **whole** list rather than dropping one key.
 *
 * Whole-state refusal is the contract (ADR-061), and grouping is where it earns
 * its keep: keys are ordered, and the order is the query's nesting order, so
 * dropping one silently answers a different question from the one the URL
 * describes. `sanitizeFiltersByColumns` drops per entry because a filter list is
 * a conjunction where each term stands alone; a key list is not.
 *
 * A duplicate key is refused for the same reason — the server refuses it too,
 * and turning a 400 into a flat table beats turning it into a 500.
 *
 * `resolveColumnCapabilities` is the only predicate here: a column keyed
 * `actions` is refused because `createActionsColumn` declares it ungroupable,
 * not because this function knows about that key.
 */
export const sanitizeGroupingByColumns = <
  TData extends Record<string, unknown>,
>({
  columns,
  grouping,
}: SanitizeGroupingByColumnsArgs<TData>) => {
  if (grouping.length === 0) {
    return [];
  }

  const groupableKeys = new Set(
    columns
      .filter((column) => resolveColumnCapabilities(column).isGroupable)
      .map((column) => String(column.key)),
  );

  const isEveryKeyGroupable = grouping.every((key) => groupableKeys.has(key));
  const areKeysDistinct = new Set(grouping).size === grouping.length;

  return isEveryKeyGroupable && areKeysDistinct ? [...grouping] : [];
};
