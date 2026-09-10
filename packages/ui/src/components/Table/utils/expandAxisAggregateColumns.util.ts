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
import { withExpandedColumnKeys } from './withExpandedColumnKeys.util';

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
  const derivedBySource = new Map<string, TableColumn<TData>[]>();

  for (const entry of emitted) {
    const source = sources.get(entry.columnKey);

    if (source === undefined || groupKeys.has(entry.columnKey)) continue;

    const header = toAxisHeaderLabel(entry.axis?.value);
    const derived = {
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
    } satisfies TableColumn<TData>;

    derivedBySource.set(entry.columnKey, [
      ...(derivedBySource.get(entry.columnKey) ?? []),
      derived,
    ]);
  }

  const measureSourceKeys = new Set(
    (emitted.length === 0 ? aggregates : emitted)
      .map((entry) => entry.columnKey)
      .filter((key) => sources.has(key) && !groupKeys.has(key)),
  );

  if (measureSourceKeys.size === 0 && derivedBySource.size === 0) {
    return unchanged;
  }

  return withExpandedColumnKeys({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    expandColumn: (column) => {
      const derived = derivedBySource.get(String(column.key));

      if (derived !== undefined) return derived;

      return measureSourceKeys.has(String(column.key)) ? [] : [column];
    },
    expandKey: (key) => {
      const derived = derivedBySource.get(String(key));

      if (derived !== undefined) return derived.map((column) => column.key);

      return measureSourceKeys.has(String(key)) ? [] : [key];
    },
  });
};
