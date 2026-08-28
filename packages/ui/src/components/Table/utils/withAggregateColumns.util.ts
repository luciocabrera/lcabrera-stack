import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { TABLE_AGGREGATE_LABELS } from '../Table.constants';
import { resolveAggregateDataType } from '../TableGroupAggregate/utils/resolveAggregateDataType.util';
import { toTableAggregateToken } from './tableAggregateToken.util';

type WithAggregateColumnsArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  /** The applied group keys — a key column carries its key, never a measure. */
  readonly groupingKeys: readonly string[];
};

/**
 * In-place derivation, never state: a group key is never measured (ADR-080); an
 * undeclared aggregate is dropped; every measured column is replaced by its measures.
 */
export const withAggregateColumns = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithAggregateColumnsArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  if (aggregates.length === 0) return unchanged;

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
      // A measure summarises rows the grid does not hold, so there is nothing
      // here to filter and nothing to group by. Sorting is the one that is
      // genuinely available: `buildGroupOrderByClause` already splices an
      // aggregate sort in at the innermost level.
      isFilterable: false,
      isGroupable: false,
      isSortable: true,
      key: toTableAggregateToken(aggregate) as DataKey<TData>,
      label: TABLE_AGGREGATE_LABELS[aggregate.fn],
      ...(source.format !== undefined && { format: source.format }),
      ...(source.isResizable !== undefined && {
        isResizable: source.isResizable,
      }),
      // The source's **layout locks** carry, because every layout action on a
      // measure resolves to the source column anyway (`toDeclaredColumnKey`).
      // Without this the derived column resolved `isStatic: false`, so
      // `TableHeaderActionsMenu` offered Pin/Hide and `TableHeaderCell` drew a
      // resize handle on a column the consumer had locked — a lock bypassed
      // through the measure that replaced it. Capability flags that describe
      // the *data* are set above instead, since a measure is not the source's
      // data: it is never filterable or groupable, and always sortable.
      ...(source.isStatic !== undefined && { isStatic: source.isStatic }),
      ...(source.maxWidth !== undefined && { maxWidth: source.maxWidth }),
      ...(source.minWidth !== undefined && { minWidth: source.minWidth }),
    };

    derivedBySource.set(aggregate.columnKey, [
      ...(derivedBySource.get(aggregate.columnKey) ?? []),
      derived,
    ]);
  }

  if (derivedBySource.size === 0) return unchanged;

  const expandKey = (key: DataKey<TData>): readonly DataKey<TData>[] => {
    const derived = derivedBySource.get(String(key));

    return derived === undefined ? [key] : derived.map((column) => column.key);
  };

  const expandKeys = (
    keys: readonly DataKey<TData>[],
  ): readonly DataKey<TData>[] => [
    ...new Set(keys.flatMap((key) => expandKey(key))),
  ];

  return {
    columnOrder: expandKeys(columnOrder),
    columnPinning: {
      left: expandKeys(columnPinning.left),
      right: expandKeys(columnPinning.right),
    },
    columns: columns.flatMap(
      (column) => derivedBySource.get(String(column.key)) ?? [column],
    ),
    // A `Set` rather than a list, but the same expansion and the same reason:
    // the settings drawer builds its rows from the **declared** columns, so
    // hiding `Total Amount` writes `total_amount` — a key `gridColumns` no
    // longer holds, which would filter nothing while the drawer drew the
    // column as hidden. Expanding here also leaves a directly-hidden measure
    // key working, since a key that is not a source passes through as itself.
    columnVisibility: new Set(expandKeys([...columnVisibility])),
  };
};
