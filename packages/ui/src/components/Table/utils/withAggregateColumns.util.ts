import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
  TableColumnAggregate,
} from '../Table.types';

import { TABLE_AGGREGATE_LABELS } from '../Table.constants';
import { resolveAggregateDataType } from '../TableGroupAggregate/utils/resolveAggregateDataType.util';
import { toTableAggregateToken } from './tableAggregateToken.util';

type WithAggregateColumnsArgs<TData> = {
  /** The applied aggregates, in the order the configuration lists them. */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  /** The applied group keys — a key column carries its key, never a measure. */
  readonly groupingKeys: readonly string[];
};

/**
 * Each measured column replaced, **in place**, by one column per aggregate
 * applied to it.
 *
 * A grouped read projects one value per aggregate, and until now every one of
 * them landed in the source column's single cell — so two measures on
 * `total_amount` rendered as one cell reading `Average … Minimum …`, truncated
 * together, and sortable, resizable and pinnable neither separately nor at all.
 * A measure is a column's worth of data; giving it a column is what puts it
 * inside the machinery every other column already has.
 *
 * **In place, rather than appended.** A column's position is something the user
 * chose, and a measure is still that column's data — moving `Total Amount` to
 * the end of the grid because it gained a second aggregate would be a layout
 * change nobody asked for. Within one source column the derived columns follow
 * the order the aggregates are staged in, which is the order the drawer's
 * reorderable list holds (#843) and the order the read emits.
 *
 * **A group key is never measured.** Under one column per key that column
 * already carries its key's value (ADR-080), so an aggregate naming it has no
 * cell to render in. `resolveGroupCellChildren` decides the same way, testing
 * the key before the aggregate, and the two must agree — this is the derivation
 * half of that rule, and dropping such an aggregate here is what stops a column
 * being emitted that nothing would ever fill.
 *
 * **An aggregate naming no declared column is dropped**, for the reason
 * `resolveDeclaredGroupingKeys` drops an undeclared key: the grouping
 * configuration is URL state, so it can name anything at all, and the honest
 * answer to a column this route does not render is to render nothing rather
 * than to invent a header for it.
 *
 * **A primary-key column is measured *beside* itself, never replaced**, and
 * this is a crash rather than a preference. `resolveCrudRowId` resolves a row's
 * id from the columns carrying `isPrimaryKey`, and throws a `TypeError` when
 * none does — so replacing the only such column takes out the row-actions menu
 * of every row on the grid, for a grouping the user can set from the URL. The
 * measure is inserted after it instead, which costs one column on a table that
 * asked to aggregate its own identifier and keeps CRUD working.
 *
 * **This is a derivation, never state.** Nothing here reaches the store or the
 * cookie the layout persists through, so clearing the grouping restores the
 * consumer's own columns exactly — the derived ones were never in the list
 * being restored. It is also why a derived key needs no pruning when its
 * aggregate is deselected: the next derivation simply does not produce it.
 */
export const withAggregateColumns = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  groupingKeys,
}: WithAggregateColumnsArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns };

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
      ...(source.maxWidth !== undefined && { maxWidth: source.maxWidth }),
      ...(source.minWidth !== undefined && { minWidth: source.minWidth }),
    };

    derivedBySource.set(aggregate.columnKey, [
      ...(derivedBySource.get(aggregate.columnKey) ??
        // The source column leads its own measures when it may not be replaced,
        // so the expansion below adds rather than substitutes.
        (source.isPrimaryKey === true ? [source] : [])),
      derived,
    ]);
  }

  if (derivedBySource.size === 0) return unchanged;

  /**
   * One key becomes the keys that replaced it, or stays as it is. Used for the
   * order and both pin lists so a measured column's replacements inherit
   * whatever the source column held — a right-pinned measure stays right, and
   * its aggregates stay adjacent.
   */
  const expandKey = (key: DataKey<TData>): readonly DataKey<TData>[] => {
    const derived = derivedBySource.get(String(key));

    return derived === undefined ? [key] : derived.map((column) => column.key);
  };

  /**
   * Expand a key list and keep the **first** occurrence of each result.
   *
   * The order and pin lists are user state restored from a cookie, so they can
   * name a measure column directly — an older build could persist one, and a
   * consumer's stored layout outlives any invariant this module holds today.
   * Expanding without deduplicating then yields the same key twice (once as
   * itself, once from its source column), and `orderColumnsByKeys` resolves
   * both to the *same* column object: two identical columns render, with
   * duplicate React keys on the header and body maps. First-wins because the
   * earlier position is the one the user last put it in.
   */
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
  };
};
