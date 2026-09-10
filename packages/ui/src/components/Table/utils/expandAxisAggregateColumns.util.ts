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
import { resolveGroupedColumnWidthBand } from './resolveGroupedColumnWidthBand.util';
import { toTableAggregateToken } from './tableAggregateToken.util';
import { toAxisHeaderLabel } from './toAxisHeaderLabel.util';

type ExpandAxisAggregateColumnsArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly emitted: readonly ColumnAxisEmittedAggregate[];
  readonly groupingKeys: readonly string[];
};

export const expandAxisAggregateColumns = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  emitted,
  groupingKeys,
}: ExpandAxisAggregateColumnsArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };
  const groupKeys = new Set(groupingKeys);
  const sources = new Map(
    columns.map((column) => [String(column.key), column] as const),
  );
  const { maxWidth, minWidth } = resolveGroupedColumnWidthBand();
  const uniqueMeasures = new Set(
    emitted.map((entry) => toTableAggregateToken(entry)),
  );
  const isSingleMeasure = uniqueMeasures.size === 1;

  const derived = emitted.flatMap((entry) => {
    const source = sources.get(entry.columnKey);

    if (source === undefined || groupKeys.has(entry.columnKey)) return [];

    const header = toAxisHeaderLabel(entry.axis?.value);

    return [
      {
        dataType: resolveAggregateDataType({
          columnDataType: source.dataType,
          fn: entry.fn,
        }),
        isFilterable: false,
        isGroupable: false,
        isSortable: true,
        key: entry.alias as DataKey<TData>,
        label: isSingleMeasure ? header : TABLE_AGGREGATE_LABELS[entry.fn],
        maxWidth,
        minWidth,
        ...(!isSingleMeasure && { headerGroupLabel: header }),
        ...(source.format !== undefined && { format: source.format }),
        ...(source.isResizable !== undefined && {
          isResizable: source.isResizable,
        }),
        ...(source.isStatic !== undefined && { isStatic: source.isStatic }),
      } satisfies TableColumn<TData>,
    ];
  });

  const measureSourceKeys = new Set(
    (emitted.length === 0 ? aggregates : emitted)
      .map((entry) => entry.columnKey)
      .filter((key) => sources.has(key) && !groupKeys.has(key)),
  );

  if (measureSourceKeys.size === 0 && derived.length === 0) return unchanged;

  const expandKey = (key: DataKey<TData>): readonly DataKey<TData>[] =>
    measureSourceKeys.has(String(key))
      ? derived.map((column) => column.key)
      : [key];

  const expandKeys = (
    keys: readonly DataKey<TData>[],
  ): readonly DataKey<TData>[] => [
    ...new Set(keys.flatMap((key) => expandKey(key))),
  ];

  let isInserted = false;

  return {
    columnOrder: expandKeys(columnOrder),
    columnPinning: {
      left: expandKeys(columnPinning.left),
      right: expandKeys(columnPinning.right),
    },
    columns: columns.flatMap((column) => {
      if (!measureSourceKeys.has(String(column.key))) return [column];

      if (isInserted) return [];

      isInserted = true;

      return derived;
    }),
    columnVisibility: new Set(expandKeys([...columnVisibility])),
  };
};
