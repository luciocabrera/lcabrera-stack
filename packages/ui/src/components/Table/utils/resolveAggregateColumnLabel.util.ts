import type { TableColumn } from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';

import { parseTableAggregateToken } from './tableAggregateToken.util';

type ResolveAggregateColumnLabelArgs<TData> = {
  readonly columnKey: string;
  readonly columns: readonly TableColumn<TData>[];
};

export const resolveAggregateColumnLabel = <TData>({
  columnKey,
  columns,
}: ResolveAggregateColumnLabelArgs<TData>) => {
  if (columns.some((column) => String(column.key) === columnKey)) return;

  const aggregate = parseTableAggregateToken(columnKey);

  if (aggregate === undefined) return;

  const source = columns.find(
    (column) => String(column.key) === aggregate.columnKey,
  );

  return `${TABLE_AGGREGATE_LABELS[aggregate.fn]} of ${source?.label ?? aggregate.columnKey}`;
};
