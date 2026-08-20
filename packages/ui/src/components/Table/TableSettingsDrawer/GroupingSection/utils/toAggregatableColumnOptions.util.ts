import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveOfferableAggregates } from '#ui/components/Table/utils/resolveOfferableAggregates.util';

type ToAggregatableColumnOptionsArgs<TData extends Record<string, unknown>> = {
  readonly capabilities: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly columns: readonly TableColumn<TData>[];
  /** The keys currently staged in the drawer draft. */
  readonly groupingKeys: readonly string[];
};

/**
 * The columns an aggregate may be applied to, as select options.
 *
 * Which columns those are is `resolveOfferableAggregates`' answer and nothing
 * this util decides — the same call the column header menu builds its
 * aggregation block from, so the picker cannot drop a column the menu still
 * offers functions on (#830). Both conditions therefore live there: the
 * catalogue's type legality (#550, ADR-058) and the column being an active
 * group key (ADR-080).
 *
 * Iterating the columns rather than the capability map is what keeps the list
 * in the table's own display order and gives each option a human label — and it
 * is all this util adds on top of the shared predicate.
 */
export const toAggregatableColumnOptions = <
  TData extends Record<string, unknown>,
>({
  capabilities,
  columns,
  groupingKeys,
}: ToAggregatableColumnOptionsArgs<TData>) => {
  const groupKeys = new Set(groupingKeys);

  return columns
    .filter(
      (column) =>
        resolveOfferableAggregates({
          capability: capabilities[String(column.key)],
          isGroupKey: groupKeys.has(String(column.key)),
        }).length > 0,
    )
    .map((column) => ({ label: column.label, value: String(column.key) }));
};
