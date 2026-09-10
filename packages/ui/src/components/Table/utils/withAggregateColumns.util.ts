import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';
import type { ColumnAxisEmittedAggregate } from './columnAxisEmitted.types';

import { TABLE_AGGREGATE_LABELS } from '../Table.constants';
import { resolveAggregateDataType } from '../TableGroupAggregate/utils/resolveAggregateDataType.util';
import { expandAxisAggregateColumns } from './expandAxisAggregateColumns.util';
import { resolveGroupedColumnWidthBand } from './resolveGroupedColumnWidthBand.util';
import { toTableAggregateToken } from './tableAggregateToken.util';
import { withExpandedColumnKeys } from './withExpandedColumnKeys.util';

type WithAggregateColumnsArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnAxis?: {
    readonly emitted: readonly ColumnAxisEmittedAggregate[];
  };
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

export const withAggregateColumns = <TData>({
  aggregates,
  columnAxis,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithAggregateColumnsArgs<TData>) => {
  if (columnAxis !== undefined) {
    return expandAxisAggregateColumns({
      aggregates,
      columnOrder,
      columnPinning,
      columns,
      columnVisibility,
      emitted: columnAxis.emitted,
      groupingKeys,
    });
  }

  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  if (aggregates.length === 0) return unchanged;

  const { maxWidth, minWidth } = resolveGroupedColumnWidthBand();
  const groupKeys = new Set(groupingKeys);
  const sources = new Map(
    columns.map((column) => [String(column.key), column] as const),
  );
  const derivedBySource = new Map<string, TableColumn<TData>[]>();

  for (const aggregate of aggregates) {
    const source = sources.get(aggregate.columnKey);

    if (source === undefined || groupKeys.has(aggregate.columnKey)) continue;

    const derived: TableColumn<TData> = {
      dataType: resolveAggregateDataType({
        columnDataType: source.dataType,
        fn: aggregate.fn,
      }),
      headerGroupLabel: source.label,
      isFilterable: false,
      isGroupable: false,
      isSortable: true,
      key: toTableAggregateToken(aggregate) as DataKey<TData>,
      label: TABLE_AGGREGATE_LABELS[aggregate.fn],
      maxWidth,
      minWidth,
      ...(source.format !== undefined && { format: source.format }),
      ...(source.isResizable !== undefined && {
        isResizable: source.isResizable,
      }),
      ...(source.isStatic !== undefined && { isStatic: source.isStatic }),
    };

    derivedBySource.set(aggregate.columnKey, [
      ...(derivedBySource.get(aggregate.columnKey) ?? []),
      derived,
    ]);
  }

  if (derivedBySource.size === 0) return unchanged;

  return withExpandedColumnKeys({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    expandColumn: (column) =>
      derivedBySource.get(String(column.key)) ?? [column],
    expandKey: (key) => {
      const derived = derivedBySource.get(String(key));

      return derived === undefined
        ? [key]
        : derived.map((column) => column.key);
    },
  });
};
