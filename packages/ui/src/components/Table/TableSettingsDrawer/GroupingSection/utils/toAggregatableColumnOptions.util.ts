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
  readonly groupingKeys: readonly string[];
};

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
