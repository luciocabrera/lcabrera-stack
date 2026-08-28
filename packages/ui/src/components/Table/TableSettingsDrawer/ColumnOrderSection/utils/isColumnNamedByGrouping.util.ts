import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

type IsColumnNamedByGroupingArgs = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnKey: string;
  readonly groupingKeys: readonly string[];
};

export const isColumnNamedByGrouping = ({
  aggregates,
  columnKey,
  groupingKeys,
}: IsColumnNamedByGroupingArgs) =>
  groupingKeys.includes(columnKey) ||
  aggregates.some((aggregate) => aggregate.columnKey === columnKey);
